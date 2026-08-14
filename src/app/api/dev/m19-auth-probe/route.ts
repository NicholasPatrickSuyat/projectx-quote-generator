/**
 * Development-only Customer/Quote auth + forgery probe (M19 E2E).
 *
 * Enabled only when:
 *   APP_ENV=development (or inferred) AND M19_AUTH_PROBE=1
 *
 * GET  — unauthenticated durable Customer/Quote action probes
 * POST — authenticated matrix + forged-input / lifecycle probes
 *
 * Never enable on Vercel production/preview.
 */

import { randomUUID } from "node:crypto";
import { auth } from "@/auth";
import {
  archiveCustomerInDb,
  createCustomerInDb,
  loadCustomersFromDb,
  restoreCustomerInDb,
  updateCustomerInDb,
} from "@/lib/actions/customers";
import {
  archiveQuoteInDb,
  createQuoteInDb,
  duplicateQuoteInDb,
  getQuoteFromDb,
  loadQuotesFromDb,
  markQuoteAcceptedInDb,
  markQuoteExpiredInDb,
  markQuoteRejectedInDb,
  markQuoteSentInDb,
  reactivateQuoteInDb,
  restoreQuoteInDb,
  returnQuoteToDraftInDb,
  updateQuoteInDb,
} from "@/lib/actions/quotes";
import { AuthorizationError } from "@/lib/auth/session";
import { getAuthMode } from "@/lib/auth/mode";
import { capabilitiesForRole } from "@/lib/auth/capabilities";
import { getAppEnv } from "@/lib/persistence/mode";
import type { Quote, QuoteLineItem } from "@/types/quote";

export const dynamic = "force-dynamic";

function probeEnabled(): boolean {
  if (process.env.M19_AUTH_PROBE !== "1") return false;
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    return false;
  }
  return getAppEnv() === "development";
}

async function outcome(label: string, fn: () => Promise<unknown>) {
  try {
    const value = await fn();
    return { label, result: "allowed" as const, value };
  } catch (error) {
    return {
      label,
      result: "denied" as const,
      code:
        error instanceof Error && "code" in error
          ? String((error as { code?: string }).code ?? "")
          : "",
      message: error instanceof Error ? error.message.slice(0, 200) : "error",
    };
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function baseLine(overrides?: Partial<QuoteLineItem>): QuoteLineItem {
  return {
    id: randomUUID(),
    category: "Services",
    description: "Probe line",
    quantity: 1,
    unitPrice: 100,
    unit: "ea",
    internalNotes: "",
    sortOrder: 0,
    lineTotal: 100,
    ...overrides,
  };
}

function draftQuotePayload(
  customerId: string,
  customerNumber: string,
  overrides?: Partial<Quote>,
): Quote {
  const line = baseLine();
  return {
    id: randomUUID(),
    quoteNumber: "CLIENT-IGNORED",
    customerSnapshot: {
      customerId,
      customerNumber,
      customerName: "Probe Customer",
      companyName: "",
      phone: "2145550100",
      email: "probe@example.com",
      street: "1 Probe St",
      city: "Dallas",
      state: "TX",
      zip: "75201",
    },
    jobDescription: "M19 probe job",
    status: "Draft",
    quoteDate: todayIso(),
    validUntil: todayIso(),
    preparedBy: "Probe Actor",
    preparedByUserId: null,
    internalNotes: "",
    customerFacingMessage: "Hello",
    termsAndConditions: "Terms",
    taxRate: 0,
    discountType: "none",
    discountValue: 0,
    lineItems: [line],
    subtotal: 100,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 100,
    createdAt: todayIso(),
    updatedAt: todayIso(),
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    archivedAt: null,
    archived: false,
    statusBeforeArchive: null,
    pdfSnapshot: null,
    ...overrides,
  };
}

export async function GET() {
  if (!probeEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const results = [
    await outcome("customersRead", () => loadCustomersFromDb()),
    await outcome("customersCreate", () =>
      createCustomerInDb({
        firstName: "Unauth",
        lastName: "Probe",
        phone: "2145550000",
        email: "unauth@example.com",
        companyName: "",
        street: "1",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        internalNotes: "",
      }),
    ),
    await outcome("quotesRead", () => loadQuotesFromDb()),
    await outcome("quotesCreate", () =>
      createQuoteInDb(
        draftQuotePayload(randomUUID(), "CUST-000000", {
          jobDescription: "unauth create",
        }),
      ),
    ),
    await outcome("quotesMarkSent", () => markQuoteSentInDb(randomUUID())),
    await outcome("quotesUpdate", () =>
      updateQuoteInDb(
        draftQuotePayload(randomUUID(), "CUST-000000", {
          jobDescription: "unauth update",
        }),
      ),
    ),
    await outcome("quotesLifecycleAccept", () =>
      markQuoteAcceptedInDb(randomUUID()),
    ),
  ];

  return Response.json({
    authMode: getAuthMode(),
    appEnv: getAppEnv(),
    results,
  });
}

export async function POST(request: Request) {
  if (!probeEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const session = await auth();
  const url = new URL(request.url);
  const suite = url.searchParams.get("suite") ?? "capabilities";

  const results: Array<Record<string, unknown>> = [
    await outcome("sessionPresent", async () => {
      if (!session?.user?.id || session.error === "SessionInvalid") {
        throw new AuthorizationError("UNAUTHENTICATED", "no session");
      }
    }),
  ];

  if (suite === "capabilities") {
    results.push(
      await outcome("customersReadAsUser", () => loadCustomersFromDb()),
      await outcome("quotesReadAsUser", () => loadQuotesFromDb()),
      await outcome("customersRestoreAsUser", () =>
        restoreCustomerInDb(randomUUID()),
      ),
      await outcome("quotesRestoreAsUser", () => restoreQuoteInDb(randomUUID())),
      await outcome("quotesExpireAsUser", () =>
        markQuoteExpiredInDb(randomUUID()),
      ),
      await outcome("quotesReactivateAsUser", () =>
        reactivateQuoteInDb(randomUUID()),
      ),
    );
  }

  if (suite === "adminFlow" || suite === "staffFlow") {
    const tag = `m19-${Date.now()}`;
    const createdCustomer = await outcome("customerCreate", () =>
      createCustomerInDb({
        firstName: "M19",
        lastName: tag,
        phone: "2145550199",
        email: `${tag}@example.com`,
        companyName: "Probe Co",
        street: "100 Probe",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        internalNotes: "",
      }),
    );
    results.push(createdCustomer);

    const customer =
      createdCustomer.result === "allowed"
        ? (createdCustomer.value as Awaited<
            ReturnType<typeof createCustomerInDb>
          >)
        : null;

    if (customer) {
      results.push(
        await outcome("customerEdit", () =>
          updateCustomerInDb(customer.id, {
            firstName: "M19 Edited",
            lastName: tag,
            phone: customer.phone,
            email: customer.email,
            companyName: customer.companyName,
            street: customer.street,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
            internalNotes: customer.internalNotes,
          }),
        ),
      );

      const draftPayload = draftQuotePayload(
        customer.id,
        customer.customerNumber,
        {
          preparedBy: session?.user?.name ?? "Actor",
          jobDescription: `Job ${tag}`,
        },
      );

      const createdQuote = await outcome("quoteCreateDraft", () =>
        createQuoteInDb(draftPayload),
      );
      results.push(createdQuote);
      const quote =
        createdQuote.result === "allowed"
          ? (createdQuote.value as Quote)
          : null;

      if (quote) {
        results.push(
          await outcome("quoteEdit", async () => {
            const updated = await updateQuoteInDb({
              ...quote,
              jobDescription: `${quote.jobDescription} edited`,
              lineItems: [
                ...quote.lineItems,
                baseLine({
                  description: "Added line",
                  unitPrice: 50,
                  lineTotal: 50,
                  sortOrder: 1,
                }),
              ],
            });
            if (!updated) throw new Error("update returned null");
            return updated;
          }),
        );

        const afterEdit = await getQuoteFromDb(quote.id);
        if (afterEdit) {
          results.push(
            await outcome("quoteReorderRemoveLines", async () => {
              const [first, ...rest] = afterEdit.lineItems;
              if (!first) throw new Error("missing line");
              const reordered = [
                ...rest.map((line, i) => ({ ...line, sortOrder: i })),
                { ...first, sortOrder: rest.length },
              ].slice(0, Math.max(1, afterEdit.lineItems.length - 0));
              // Keep at least one line; drop the last if 2+
              const nextLines =
                reordered.length > 1 ? reordered.slice(0, -1) : reordered;
              const updated = await updateQuoteInDb({
                ...afterEdit,
                lineItems: nextLines.map((line, i) => ({
                  ...line,
                  sortOrder: i,
                })),
              });
              if (!updated) throw new Error("line reconcile failed");
              return updated;
            }),
          );
        }

        results.push(
          await outcome("quoteDuplicate", () => duplicateQuoteInDb(quote.id)),
        );

        const markSent = await outcome("quoteMarkSent", () =>
          markQuoteSentInDb(quote.id),
        );
        results.push(markSent);
        const sent =
          markSent.result === "allowed" ? (markSent.value as Quote) : null;

        if (sent) {
          results.push(
            await outcome("quotePdfSnapshotServerOwned", async () => {
              if (!sent.pdfSnapshot) throw new Error("missing pdf_snapshot");
              if (sent.pdfSnapshot.quote.quoteId !== sent.quoteNumber) {
                throw new Error("snapshot quote number mismatch");
              }
              return sent.pdfSnapshot.frozenAt;
            }),
          );

          results.push(
            await outcome("quoteAccept", () => markQuoteAcceptedInDb(sent.id)),
          );
          // Return path: need Sent again — duplicate then mark sent for reject path
          const dup = await duplicateQuoteInDb(quote.id);
          if (dup) {
            const sent2 = await markQuoteSentInDb(dup.id);
            if (sent2) {
              results.push(
                await outcome("quoteReject", () =>
                  markQuoteRejectedInDb(sent2.id),
                ),
              );
            }
          }

          const dup3 = await duplicateQuoteInDb(quote.id);
          if (dup3) {
            const sent3 = await markQuoteSentInDb(dup3.id);
            if (sent3) {
              results.push(
                await outcome("quoteReturnToDraft", () =>
                  returnQuoteToDraftInDb(sent3.id),
                ),
              );
            }
          }

          if (suite === "adminFlow") {
            const dup4 = await duplicateQuoteInDb(quote.id);
            if (dup4) {
              const sent4 = await markQuoteSentInDb(dup4.id);
              if (sent4) {
                const expired = await outcome("quoteManualExpire", () =>
                  markQuoteExpiredInDb(sent4.id),
                );
                results.push(expired);
                if (expired.result === "allowed") {
                  results.push(
                    await outcome("quoteReactivate", () =>
                      reactivateQuoteInDb(sent4.id),
                    ),
                  );
                }
              }
            }
          } else {
            results.push(
              await outcome("quoteManualExpire", () =>
                markQuoteExpiredInDb(quote.id),
              ),
            );
            results.push(
              await outcome("quoteReactivate", () =>
                reactivateQuoteInDb(quote.id),
              ),
            );
          }
        }

        results.push(
          await outcome("quoteArchive", () => archiveQuoteInDb(quote.id)),
        );
        results.push(
          await outcome("quoteRestore", () => restoreQuoteInDb(quote.id)),
        );
      }

      results.push(
        await outcome("customerArchive", () => archiveCustomerInDb(customer.id)),
      );
      results.push(
        await outcome("customerRestore", () =>
          restoreCustomerInDb(customer.id),
        ),
      );
    }
  }

  if (suite === "forged") {
    const customers = await loadCustomersFromDb();
    const customer = customers.find((c) => !c.archived) ?? customers[0];
    if (!customer) {
      results.push({
        label: "forgedSuite",
        result: "denied",
        message: "no customer available",
      });
    } else {
      results.push(
        await outcome("forgeCreateSent", async () => {
          await createQuoteInDb(
            draftQuotePayload(customer.id, customer.customerNumber, {
              status: "Sent",
              sentAt: todayIso(),
            }),
          );
        }),
      );

      results.push(
        await outcome("forgeCreatePdfSnapshot", async () => {
          await createQuoteInDb(
            draftQuotePayload(customer.id, customer.customerNumber, {
              pdfSnapshot: {
                frozenAt: todayIso(),
                company: {
                  companyName: "Evil",
                  logo: null,
                  phone: "0",
                  email: "e@e.e",
                  website: "",
                  street: "s",
                  city: "c",
                  state: "TX",
                  zip: "75201",
                  currency: "USD",
                  pdfFooterText: "",
                },
                quote: {
                  quoteId: "QUO-FAKE",
                  quoteDate: todayIso(),
                  validUntil: null,
                  preparedBy: "Evil",
                  jobDescription: "x",
                  customerFacingMessage: "",
                  termsAndConditions: "",
                  customerSnapshot: {
                    customerId: customer.id,
                    customerNumber: customer.customerNumber,
                    customerName: "X",
                    companyName: "",
                    phone: "1",
                    email: "",
                    street: "s",
                    city: "c",
                    state: "TX",
                    zip: "75201",
                  },
                  lineItems: [],
                  subtotalCents: 0,
                  discountType: "none",
                  discountValue: 0,
                  discountAmountCents: 0,
                  taxRate: 0,
                  taxAmountCents: 0,
                  grandTotalCents: 0,
                },
              },
            }),
          );
        }),
      );

      const draft = await createQuoteInDb(
        draftQuotePayload(customer.id, customer.customerNumber, {
          jobDescription: "Forgery base draft",
          preparedBy: "Should Be Normalized For Staff",
        }),
      );
      results.push({
        label: "forgeBaseDraftCreated",
        result: "allowed",
        status: draft.status,
        pdfSnapshotNull: draft.pdfSnapshot == null,
        preparedBy: draft.preparedBy,
      });

      results.push(
        await outcome("forgeUpdateToAccepted", async () => {
          const updated = await updateQuoteInDb({
            ...draft,
            status: "Accepted",
            acceptedAt: todayIso(),
          });
          if (updated?.status === "Accepted") {
            // Forgery succeeded — surface as allowed so E2E fails the deny assert.
            return updated;
          }
          throw new Error("FORGERY_IGNORED");
        }),
      );

      results.push(
        await outcome("forgeUpdateSentAt", async () => {
          const updated = await updateQuoteInDb({
            ...draft,
            sentAt: todayIso(),
            status: "Sent",
          });
          if (updated?.status === "Sent" || updated?.sentAt) {
            return updated;
          }
          throw new Error("FORGERY_IGNORED");
        }),
      );

      const other = await createQuoteInDb(
        draftQuotePayload(customer.id, customer.customerNumber, {
          jobDescription: "Other quote for line steal",
        }),
      );
      const foreignLineId = other.lineItems[0]?.id;
      results.push(
        await outcome("forgeForeignLineUuid", async () => {
          if (!foreignLineId) throw new Error("missing foreign line");
          await updateQuoteInDb({
            ...draft,
            lineItems: [
              baseLine({
                id: foreignLineId,
                description: "Stolen",
                unitPrice: 999,
                lineTotal: 999,
              }),
            ],
          });
        }),
      );

      results.push(
        await outcome("forgeForeignCustomer", async () => {
          await createQuoteInDb(
            draftQuotePayload(randomUUID(), "CUST-999999", {
              jobDescription: "cross-company customer",
            }),
          );
        }),
      );

      // Staff prepared-by spoof: create with someone else's name
      results.push(
        await outcome("forgePreparedByCreate", async () => {
          const created = await createQuoteInDb(
            draftQuotePayload(customer.id, customer.customerNumber, {
              preparedBy: "Totally Different Employee",
              preparedByUserId: randomUUID(),
              jobDescription: "prepared by spoof",
            }),
          );
          return {
            preparedBy: created.preparedBy,
            preparedByUserId: created.preparedByUserId,
            actorName: session?.user?.name ?? null,
            actorId: session?.user?.id ?? null,
          };
        }),
      );

      // Customer snapshot: same customer edit should not rewrite quote snapshot
      const beforeSnap = draft.customerSnapshot?.customerName;
      await updateCustomerInDb(customer.id, {
        firstName: "ChangedLive",
        lastName: customer.lastName,
        phone: customer.phone,
        email: customer.email,
        companyName: customer.companyName,
        street: customer.street,
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        internalNotes: customer.internalNotes,
      });
      const reloaded = await getQuoteFromDb(draft.id);
      results.push({
        label: "customerEditKeepsQuoteSnapshot",
        result:
          reloaded?.customerSnapshot?.customerName === beforeSnap
            ? "allowed"
            : "denied",
        before: beforeSnap,
        after: reloaded?.customerSnapshot?.customerName,
      });

      // Selecting a different customer on Draft must refresh snapshot
      const otherCustomer = await createCustomerInDb({
        firstName: "Other",
        lastName: tagName(),
        phone: "2145550200",
        email: `other-${Date.now()}@example.com`,
        companyName: "",
        street: "2 Other",
        city: "Dallas",
        state: "TX",
        zip: "75201",
        internalNotes: "",
      });
      const switched = await updateQuoteInDb({
        ...draft,
        customerSnapshot: {
          customerId: otherCustomer.id,
          customerNumber: otherCustomer.customerNumber,
          customerName: "STALE CLIENT NAME",
          companyName: "",
          phone: "0",
          email: "",
          street: "x",
          city: "x",
          state: "TX",
          zip: "00000",
        },
      });
      results.push({
        label: "draftCustomerSwitchRebuildsSnapshot",
        result:
          switched?.customerSnapshot?.customerId === otherCustomer.id &&
          switched.customerSnapshot.customerName.includes("Other")
            ? "allowed"
            : "denied",
        snapshotName: switched?.customerSnapshot?.customerName,
      });

      // Cleanup probe artifacts (best effort)
      await outcome("cleanupQuotes", async () => {
        for (const id of [draft.id, other.id]) {
          try {
            await archiveQuoteInDb(id);
          } catch {
            /* ignore */
          }
        }
      });
    }
  }

  const role = session?.user?.role;
  return Response.json({
    authMode: getAuthMode(),
    role: role ?? null,
    capabilities: role ? capabilitiesForRole(role) : null,
    suite,
    results,
  });
}

function tagName(): string {
  return `m19-${Date.now()}`;
}
