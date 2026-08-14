import { and, asc, eq, inArray, notInArray } from "drizzle-orm";
import { getAuthMode } from "@/lib/auth/mode";
import { getDb } from "@/lib/db/client";
import { customers, quoteLineItems, quotes } from "@/lib/db/schema";
import { startOfDay, toIsoDate } from "@/lib/format";
import { createQuotePdfSnapshot } from "@/lib/pdf/snapshot";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import { applyAutoExpirations } from "@/lib/quotes/auto-expire";
import { customerToSnapshot } from "@/lib/quotes/demo-data";
import {
  archiveQuote,
  duplicateQuote,
  markQuoteAccepted,
  markQuoteExpired,
  markQuoteRejected,
  markQuoteSent,
  quoteIsEditable,
  reactivateQuoteToDraft,
  restoreQuote,
  returnQuoteToDraft,
} from "@/lib/quotes/mutations";
import {
  canMarkAsSent,
  stripEmptyLines,
  validateQuoteForPersist,
} from "@/lib/quotes/validation";
import { allocateNextBusinessNumber } from "@/lib/persistence/entity-counters";
import { createDbCompanySettingsRepository } from "@/lib/persistence/db-company-settings-repository";
import {
  customerRowToDomain,
  domainTimestampToDate,
  quoteRowToDomain,
  toQuoteBusinessUpdateSet,
  toQuoteInsertForCreate,
  toQuoteLifecycleUpdateSet,
  toQuoteLineInsert,
} from "@/lib/persistence/mappers";
import type { QuoteRepository } from "@/lib/persistence/ports";
import { assertServerModule } from "@/lib/server-module";
import type { CompanyQuoteDefaults } from "@/types/company";
import type { Customer } from "@/types/customer";
import type { Quote, QuoteLineItem, QuoteStatus } from "@/types/quote";

assertServerModule("@/lib/persistence/db-quotes-repository");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const LIFECYCLE_CONFLICT_MESSAGE =
  "Quote was updated by another action. Refresh and try again.";

export type QuoteRepositoryActor = {
  userId: string;
  fullName: string;
  canOverridePreparedBy: boolean;
  canRestore: boolean;
  canOverrideQuoteStatus: boolean;
};

type LifecycleCasGuard = {
  /** Prior status(es) required for the UPDATE to apply. */
  expectedStatus: QuoteStatus | QuoteStatus[];
  /** Prior archived flag required for the UPDATE to apply. */
  expectedArchived: boolean;
};

function assertValidUuid(id: string, label: string): void {
  if (!UUID_RE.test(id)) {
    throw new Error(`Invalid ${label} UUID.`);
  }
}

function assertValidQuote(quote: Quote): void {
  const sanitized = {
    ...quote,
    lineItems: stripEmptyLines(quote.lineItems),
  };
  const errors = validateQuoteForPersist(sanitized);
  const messages = [
    errors.customer,
    errors.jobDescription,
    errors.quoteDate,
    errors.taxRate,
    errors.discountValue,
    errors.lineItems,
    ...Object.values(errors.lines ?? {}).flatMap((line) =>
      Object.values(line).filter(Boolean),
    ),
  ].filter(Boolean);
  if (messages[0]) throw new Error(messages[0] as string);
}

/** Reject client-supplied lifecycle / freeze fields on create. */
function assertCreateRejectsLifecycleFields(quote: Quote): void {
  if (quote.status !== "Draft") {
    throw new Error("New quotes must be created as Draft.");
  }
  if (quote.pdfSnapshot != null) {
    throw new Error("Cannot set pdfSnapshot on create.");
  }
  if (quote.sentAt != null) {
    throw new Error("Cannot set sentAt on create.");
  }
  if (quote.acceptedAt != null) {
    throw new Error("Cannot set acceptedAt on create.");
  }
  if (quote.rejectedAt != null) {
    throw new Error("Cannot set rejectedAt on create.");
  }
  if (quote.expiredAt != null) {
    throw new Error("Cannot set expiredAt on create.");
  }
  if (quote.archivedAt != null) {
    throw new Error("Cannot set archivedAt on create.");
  }
  if (quote.archived === true) {
    throw new Error("Cannot create an archived quote.");
  }
  if (quote.statusBeforeArchive != null) {
    throw new Error("Cannot set statusBeforeArchive on create.");
  }
}

function sanitizeLineItemsForSave(lines: QuoteLineItem[]): QuoteLineItem[] {
  return stripEmptyLines(lines).map((line, index) => ({
    ...line,
    id: UUID_RE.test(line.id) ? line.id : crypto.randomUUID(),
    sortOrder: index,
  }));
}

function normalizePreparedBy(
  quote: Quote,
  actor: QuoteRepositoryActor | undefined,
  existing: Quote | undefined,
): Quote {
  if (!actor) return quote;
  if (actor.canOverridePreparedBy) {
    return {
      ...quote,
      // Admin may override the display name; attribution FK stays the actor.
      preparedBy: quote.preparedBy.trim() || actor.fullName,
      preparedByUserId: actor.userId,
    };
  }
  if (existing) {
    return {
      ...quote,
      preparedBy: existing.preparedBy,
      preparedByUserId: existing.preparedByUserId,
    };
  }
  return {
    ...quote,
    preparedBy: actor.fullName,
    preparedByUserId: actor.userId,
  };
}

async function loadCustomerInCompany(
  companyId: string,
  customerId: string,
): Promise<Customer> {
  assertValidUuid(customerId, "customer");
  const db = getDb();
  const rows = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.companyId, companyId), eq(customers.id, customerId)),
    )
    .limit(1);
  if (!rows[0]) {
    throw new Error("Customer not found for this company.");
  }
  const customer = customerRowToDomain(rows[0]);
  if (customer.archived) {
    throw new Error(
      "Archived customers cannot receive new quotes until restored.",
    );
  }
  return customer;
}

async function loadQuoteWithLines(
  companyId: string,
  id: string,
): Promise<Quote | undefined> {
  const db = getDb();
  const quoteRows = await db
    .select()
    .from(quotes)
    .where(and(eq(quotes.companyId, companyId), eq(quotes.id, id)))
    .limit(1);
  if (!quoteRows[0]) return undefined;
  const lineRows = await db
    .select()
    .from(quoteLineItems)
    .where(
      and(
        eq(quoteLineItems.companyId, companyId),
        eq(quoteLineItems.quoteId, id),
      ),
    )
    .orderBy(asc(quoteLineItems.sortOrder));
  return quoteRowToDomain(quoteRows[0], lineRows);
}

/**
 * Persist a dedicated lifecycle transition with compare-and-set on prior
 * status + archived flag. Zero rows → conflict (do not overwrite newer state).
 */
async function persistLifecycleQuote(
  companyId: string,
  quote: Quote,
  guard: LifecycleCasGuard,
): Promise<Quote> {
  const db = getDb();
  const now = new Date();
  const expectedStatuses = Array.isArray(guard.expectedStatus)
    ? guard.expectedStatus
    : [guard.expectedStatus];

  const rows = await db
    .update(quotes)
    .set(toQuoteLifecycleUpdateSet(quote, now))
    .where(
      and(
        eq(quotes.companyId, companyId),
        eq(quotes.id, quote.id),
        eq(quotes.archived, guard.expectedArchived),
        inArray(quotes.status, expectedStatuses),
      ),
    )
    .returning();

  if (!rows[0]) {
    const existing = await loadQuoteWithLines(companyId, quote.id);
    if (!existing) {
      throw new Error("Quote not found.");
    }
    throw new Error(LIFECYCLE_CONFLICT_MESSAGE);
  }

  const lineRows = await db
    .select()
    .from(quoteLineItems)
    .where(
      and(
        eq(quoteLineItems.companyId, companyId),
        eq(quoteLineItems.quoteId, quote.id),
      ),
    )
    .orderBy(asc(quoteLineItems.sortOrder));
  return quoteRowToDomain(rows[0], lineRows);
}

/**
 * Persist auto-expire only in production, and only while status is still Sent
 * (race guard). Never touches pdf_snapshot.
 */
async function persistAutoExpirationsIfProduction(
  companyId: string,
  original: Quote[],
  expired: Quote[],
): Promise<void> {
  if (getAuthMode() !== "production") return;
  if (expired === original) return;

  const changed = expired.filter((quote, index) => {
    const before = original[index];
    return before && before.status !== quote.status;
  });
  if (changed.length === 0) return;

  const db = getDb();
  await db.transaction(async (tx) => {
    for (const quote of changed) {
      await tx
        .update(quotes)
        .set({
          status: "Expired",
          expiredAt:
            domainTimestampToDate(quote.expiredAt) ?? new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quotes.companyId, companyId),
            eq(quotes.id, quote.id),
            eq(quotes.status, "Sent"),
          ),
        );
    }
  });
}

async function reconcileLinesInTx(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  companyId: string,
  quoteId: string,
  lines: QuoteLineItem[],
  now: Date,
): Promise<void> {
  const existingRows = await tx
    .select({ id: quoteLineItems.id })
    .from(quoteLineItems)
    .where(
      and(
        eq(quoteLineItems.companyId, companyId),
        eq(quoteLineItems.quoteId, quoteId),
      ),
    );
  const existingIds = new Set(existingRows.map((row) => row.id));
  const keptIds: string[] = [];

  for (const line of lines) {
    if (existingIds.has(line.id)) {
      const values = toQuoteLineInsert(line, companyId, quoteId, now);
      await tx
        .update(quoteLineItems)
        .set({
          category: values.category,
          description: values.description,
          quantity: values.quantity,
          unit: values.unit,
          unitPriceCents: values.unitPriceCents,
          lineTotalCents: values.lineTotalCents,
          internalNotes: values.internalNotes,
          sortOrder: values.sortOrder,
          updatedAt: now,
        })
        .where(
          and(
            eq(quoteLineItems.companyId, companyId),
            eq(quoteLineItems.quoteId, quoteId),
            eq(quoteLineItems.id, line.id),
          ),
        );
      keptIds.push(line.id);
      continue;
    }

    if (UUID_RE.test(line.id)) {
      const foreign = await tx
        .select({ id: quoteLineItems.id })
        .from(quoteLineItems)
        .where(eq(quoteLineItems.id, line.id))
        .limit(1);
      if (foreign[0]) {
        throw new Error("Line item does not belong to this quote.");
      }
    }

    const newId = crypto.randomUUID();
    await tx
      .insert(quoteLineItems)
      .values(
        toQuoteLineInsert({ ...line, id: newId }, companyId, quoteId, now),
      );
    keptIds.push(newId);
  }

  if (keptIds.length === 0) {
    await tx
      .delete(quoteLineItems)
      .where(
        and(
          eq(quoteLineItems.companyId, companyId),
          eq(quoteLineItems.quoteId, quoteId),
        ),
      );
    return;
  }

  await tx
    .delete(quoteLineItems)
    .where(
      and(
        eq(quoteLineItems.companyId, companyId),
        eq(quoteLineItems.quoteId, quoteId),
        notInArray(quoteLineItems.id, keptIds),
      ),
    );
}

async function insertQuoteWithLinesInTx(
  tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0],
  companyId: string,
  quote: Quote,
  quoteNumber: string,
  customerId: string,
  now: Date,
): Promise<Quote> {
  const header = toQuoteInsertForCreate(
    quote,
    companyId,
    customerId,
    quoteNumber,
    now,
  );
  const inserted = await tx.insert(quotes).values(header).returning();
  const row = inserted[0];
  if (!row) throw new Error("Failed to insert quote.");

  if (quote.lineItems.length > 0) {
    await tx.insert(quoteLineItems).values(
      quote.lineItems.map((line) =>
        toQuoteLineInsert(
          { ...line, id: crypto.randomUUID() },
          companyId,
          row.id,
          now,
        ),
      ),
    );
  }

  const lineRows = await tx
    .select()
    .from(quoteLineItems)
    .where(
      and(
        eq(quoteLineItems.companyId, companyId),
        eq(quoteLineItems.quoteId, row.id),
      ),
    )
    .orderBy(asc(quoteLineItems.sortOrder));

  return quoteRowToDomain(row, lineRows);
}

/**
 * Company-scoped durable quotes.
 * Actor capabilities gate restore / expire / reactivate / prepared-by overrides.
 */
export function createDbQuotesRepository(
  companyId: string,
  actor?: QuoteRepositoryActor,
): QuoteRepository {
  return {
    async list(): Promise<Quote[]> {
      const db = getDb();
      const quoteRows = await db
        .select()
        .from(quotes)
        .where(eq(quotes.companyId, companyId))
        .orderBy(asc(quotes.quoteDate), asc(quotes.quoteNumber));

      if (quoteRows.length === 0) return [];

      const quoteIds = quoteRows.map((row) => row.id);
      const lineRows = await db
        .select()
        .from(quoteLineItems)
        .where(
          and(
            eq(quoteLineItems.companyId, companyId),
            inArray(quoteLineItems.quoteId, quoteIds),
          ),
        )
        .orderBy(asc(quoteLineItems.sortOrder));

      const linesByQuote = new Map<string, typeof lineRows>();
      for (const line of lineRows) {
        const bucket = linesByQuote.get(line.quoteId) ?? [];
        bucket.push(line);
        linesByQuote.set(line.quoteId, bucket);
      }

      const mapped = quoteRows.map((row) =>
        quoteRowToDomain(row, linesByQuote.get(row.id) ?? []),
      );

      const today = startOfDay(new Date());
      const expired = applyAutoExpirations(mapped, today);
      await persistAutoExpirationsIfProduction(companyId, mapped, expired);
      return expired;
    },

    async get(id: string): Promise<Quote | undefined> {
      const quote = await loadQuoteWithLines(companyId, id);
      if (!quote) return undefined;

      const today = startOfDay(new Date());
      const [maybeExpired] = applyAutoExpirations([quote], today);
      await persistAutoExpirationsIfProduction(
        companyId,
        [quote],
        [maybeExpired],
      );
      return maybeExpired;
    },

    async create(quote: Quote): Promise<Quote> {
      assertCreateRejectsLifecycleFields(quote);

      const id = UUID_RE.test(quote.id) ? quote.id : crypto.randomUUID();
      let draft: Quote = withRecalculatedTotals({
        ...quote,
        id,
        status: "Draft" as const,
        pdfSnapshot: null,
        sentAt: null,
        acceptedAt: null,
        rejectedAt: null,
        expiredAt: null,
        archivedAt: null,
        archived: false,
        statusBeforeArchive: null,
        lineItems: sanitizeLineItemsForSave(quote.lineItems).map((line) => ({
          ...line,
          id: crypto.randomUUID(),
        })),
      });
      draft = normalizePreparedBy(draft, actor, undefined);
      assertValidQuote(draft);

      const customerId = draft.customerSnapshot?.customerId;
      if (!customerId) throw new Error("Select a customer before saving.");
      const dbCustomer = await loadCustomerInCompany(companyId, customerId);
      draft = {
        ...draft,
        customerSnapshot: customerToSnapshot(dbCustomer),
      };

      const db = getDb();
      const now = new Date();

      return db.transaction(async (tx) => {
        const quoteNumber = await allocateNextBusinessNumber(
          tx,
          companyId,
          "quote",
        );
        return insertQuoteWithLinesInTx(
          tx,
          companyId,
          { ...draft, quoteNumber },
          quoteNumber,
          customerId,
          now,
        );
      });
    },

    async update(quote: Quote): Promise<Quote | null> {
      const existing = await loadQuoteWithLines(companyId, quote.id);
      if (!existing) return null;

      if (!quoteIsEditable(existing) || existing.archived) {
        throw new Error("This quote cannot be edited in its current status.");
      }

      const incomingCustomerId = quote.customerSnapshot?.customerId;
      if (!incomingCustomerId) {
        throw new Error("Select a customer before saving.");
      }

      let customerSnapshot = existing.customerSnapshot;
      if (incomingCustomerId !== existing.customerSnapshot?.customerId) {
        const dbCustomer = await loadCustomerInCompany(
          companyId,
          incomingCustomerId,
        );
        customerSnapshot = customerToSnapshot(dbCustomer);
      }

      let next: Quote = withRecalculatedTotals({
        ...existing,
        jobDescription: quote.jobDescription,
        quoteDate: quote.quoteDate,
        validUntil: quote.validUntil,
        internalNotes: quote.internalNotes,
        customerFacingMessage: quote.customerFacingMessage,
        termsAndConditions: quote.termsAndConditions,
        taxRate: quote.taxRate,
        discountType: quote.discountType,
        discountValue: quote.discountValue,
        customerSnapshot,
        lineItems: sanitizeLineItemsForSave(quote.lineItems),
        // Immutable / lifecycle — always from existing
        quoteNumber: existing.quoteNumber,
        status: existing.status,
        pdfSnapshot: existing.pdfSnapshot,
        sentAt: existing.sentAt,
        acceptedAt: existing.acceptedAt,
        rejectedAt: existing.rejectedAt,
        expiredAt: existing.expiredAt,
        archived: existing.archived,
        archivedAt: existing.archivedAt,
        statusBeforeArchive: existing.statusBeforeArchive,
      });
      next = normalizePreparedBy(next, actor, existing);
      assertValidQuote(next);

      const db = getDb();
      const now = new Date();

      return db.transaction(async (tx) => {
        const rows = await tx
          .update(quotes)
          .set(toQuoteBusinessUpdateSet(next, now))
          .where(and(eq(quotes.companyId, companyId), eq(quotes.id, next.id)))
          .returning();
        if (!rows[0]) return null;

        await reconcileLinesInTx(
          tx,
          companyId,
          next.id,
          next.lineItems,
          now,
        );

        const lineRows = await tx
          .select()
          .from(quoteLineItems)
          .where(
            and(
              eq(quoteLineItems.companyId, companyId),
              eq(quoteLineItems.quoteId, next.id),
            ),
          )
          .orderBy(asc(quoteLineItems.sortOrder));

        return quoteRowToDomain(rows[0], lineRows);
      });
    },

    async duplicate(
      id: string,
      defaults: CompanyQuoteDefaults,
      options?: { preparedBy?: string },
    ): Promise<Quote | null> {
      const source = await loadQuoteWithLines(companyId, id);
      if (!source) return null;

      const today = startOfDay(new Date());
      let copy = duplicateQuote(source, [], today, defaults);

      if (actor?.canOverridePreparedBy && options?.preparedBy !== undefined) {
        copy = {
          ...copy,
          preparedBy: options.preparedBy,
          preparedByUserId: actor.userId,
        };
      } else if (actor) {
        copy = {
          ...copy,
          preparedBy: actor.fullName,
          preparedByUserId: actor.userId,
        };
      }

      copy = withRecalculatedTotals({
        ...copy,
        lineItems: sanitizeLineItemsForSave(copy.lineItems),
      });
      assertValidQuote(copy);

      const customerId = copy.customerSnapshot?.customerId;
      if (!customerId) throw new Error("Cannot duplicate quote without a customer.");
      await loadCustomerInCompany(companyId, customerId);

      const db = getDb();
      const now = new Date();

      return db.transaction(async (tx) => {
        const quoteNumber = await allocateNextBusinessNumber(
          tx,
          companyId,
          "quote",
        );
        return insertQuoteWithLinesInTx(
          tx,
          companyId,
          { ...copy, quoteNumber },
          quoteNumber,
          customerId,
          now,
        );
      });
    },

    async archive(id: string): Promise<void> {
      const current = await loadQuoteWithLines(companyId, id);
      if (!current || current.archived) return;
      const next = archiveQuote(current, startOfDay(new Date()));
      await persistLifecycleQuote(companyId, next, {
        expectedStatus: current.status,
        expectedArchived: false,
      });
    },

    async restore(id: string): Promise<void> {
      if (actor && !actor.canRestore) {
        throw new Error("You do not have permission to restore quotes.");
      }
      const current = await loadQuoteWithLines(companyId, id);
      if (!current || !current.archived) return;
      const next = restoreQuote(current, startOfDay(new Date()));
      await persistLifecycleQuote(companyId, next, {
        expectedStatus: current.status,
        expectedArchived: true,
      });
    },

    async markSent(id: string): Promise<Quote | null> {
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot be marked Sent.");
      }
      if (current.status !== "Draft") {
        throw new Error("Only Draft quotes can be marked Sent.");
      }
      const check = canMarkAsSent(current);
      if (!check.ok) {
        throw new Error(check.reason);
      }
      const settings = await createDbCompanySettingsRepository().get();
      const today = startOfDay(new Date());
      const frozenAt = toIsoDate(today);
      // Server-owned freeze — never trust client pdfSnapshot.
      const pdfSnapshot = createQuotePdfSnapshot(current, settings, frozenAt);
      const next = markQuoteSent(current, today, pdfSnapshot);
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Draft",
        expectedArchived: false,
      });
    },

    async returnToDraft(id: string): Promise<Quote | null> {
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot return to Draft.");
      }
      if (current.status !== "Sent") {
        throw new Error("Only Sent quotes can return to Draft.");
      }
      const next = returnQuoteToDraft(current, startOfDay(new Date()));
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Sent",
        expectedArchived: false,
      });
    },

    async markAccepted(id: string): Promise<Quote | null> {
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot be accepted.");
      }
      if (current.status !== "Sent") {
        throw new Error("Only Sent quotes can be accepted.");
      }
      const next = markQuoteAccepted(current, startOfDay(new Date()));
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Sent",
        expectedArchived: false,
      });
    },

    async markRejected(id: string): Promise<Quote | null> {
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot be rejected.");
      }
      if (current.status !== "Sent") {
        throw new Error("Only Sent quotes can be rejected.");
      }
      const next = markQuoteRejected(current, startOfDay(new Date()));
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Sent",
        expectedArchived: false,
      });
    },

    async markExpired(id: string): Promise<Quote | null> {
      if (actor && !actor.canOverrideQuoteStatus) {
        throw new Error("You do not have permission to expire quotes.");
      }
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot be expired.");
      }
      if (current.status !== "Sent") {
        throw new Error("Only Sent quotes can be manually expired.");
      }
      const next = markQuoteExpired(current, startOfDay(new Date()));
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Sent",
        expectedArchived: false,
      });
    },

    async reactivate(
      id: string,
      defaults: CompanyQuoteDefaults,
    ): Promise<Quote | null> {
      if (actor && !actor.canOverrideQuoteStatus) {
        throw new Error("You do not have permission to reactivate quotes.");
      }
      const current = await loadQuoteWithLines(companyId, id);
      if (!current) return null;
      if (current.archived) {
        throw new Error("Archived quotes cannot be reactivated.");
      }
      if (current.status !== "Expired") {
        throw new Error("Only Expired quotes can be reactivated.");
      }
      const next = reactivateQuoteToDraft(
        current,
        startOfDay(new Date()),
        defaults,
      );
      return persistLifecycleQuote(companyId, next, {
        expectedStatus: "Expired",
        expectedArchived: false,
      });
    },
  };
}
