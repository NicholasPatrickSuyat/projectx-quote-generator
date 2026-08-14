"use server";

import {
  assertCanMutateQuotesInDatabase,
  assertCanOverrideQuoteStatusInDatabase,
  assertCanReadQuotesFromDatabase,
  assertCanRestoreQuoteInDatabase,
} from "@/lib/auth/assert-capability";
import {
  type AuthorizedUser,
  requireDatabaseQuoteMutation,
  requireDatabaseQuotesRead,
} from "@/lib/auth/session";
import type { RoleCapabilities } from "@/lib/auth/capabilities";
import { getDb } from "@/lib/db/client";
import { company } from "@/lib/db/schema";
import { createDbCompanySettingsRepository } from "@/lib/persistence/db-company-settings-repository";
import {
  createDbQuotesRepository,
  type QuoteRepositoryActor,
} from "@/lib/persistence/db-quotes-repository";
import { companyQuoteDefaultsFromSettings } from "@/types/company";
import type { Quote } from "@/types/quote";

async function requireSingletonCompanyId(): Promise<string> {
  const db = getDb();
  const rows = await db.select({ id: company.id }).from(company).limit(2);
  if (rows.length === 0) {
    throw new Error(
      "No company row found. Run npm run db:bootstrap:company first.",
    );
  }
  if (rows.length > 1) {
    throw new Error(
      "Multiple company rows found. M17 expects a single-company installation.",
    );
  }
  return rows[0].id;
}

async function resolveReadCompanyId(): Promise<string> {
  const user = await requireDatabaseQuotesRead();
  if (user) return user.companyId;
  return requireSingletonCompanyId();
}

function actorFromMutation(
  user: AuthorizedUser,
  capabilities: RoleCapabilities,
): QuoteRepositoryActor {
  return {
    userId: user.id,
    fullName: user.fullName,
    canOverridePreparedBy: capabilities.canOverridePreparedBy,
    canRestore: capabilities.canRestore,
    canOverrideQuoteStatus: capabilities.canOverrideQuoteStatus,
  };
}

async function quotesRepoForMutation() {
  const { user, capabilities } = await requireDatabaseQuoteMutation();
  return {
    user,
    capabilities,
    repo: createDbQuotesRepository(
      user.companyId,
      actorFromMutation(user, capabilities),
    ),
  };
}

export async function loadQuotesFromDb(): Promise<Quote[]> {
  await assertCanReadQuotesFromDatabase();
  const companyId = await resolveReadCompanyId();
  return createDbQuotesRepository(companyId).list();
}

export async function getQuoteFromDb(id: string): Promise<Quote | undefined> {
  await assertCanReadQuotesFromDatabase();
  const companyId = await resolveReadCompanyId();
  return createDbQuotesRepository(companyId).get(id);
}

export async function createQuoteInDb(quote: Quote): Promise<Quote> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.create(quote);
}

export async function updateQuoteInDb(quote: Quote): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.update(quote);
}

export async function duplicateQuoteInDb(
  id: string,
  options?: { preparedBy?: string },
): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  const settings = await createDbCompanySettingsRepository().get();
  return repo.duplicate(id, companyQuoteDefaultsFromSettings(settings), options);
}

export async function archiveQuoteInDb(id: string): Promise<void> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.archive(id);
}

export async function restoreQuoteInDb(id: string): Promise<void> {
  await assertCanRestoreQuoteInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.restore(id);
}

/**
 * Mark Sent / Final: freezes pdf_snapshot server-side from current quote + settings.
 */
export async function markQuoteSentInDb(id: string): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.markSent(id);
}

export async function returnQuoteToDraftInDb(
  id: string,
): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.returnToDraft(id);
}

export async function markQuoteAcceptedInDb(
  id: string,
): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.markAccepted(id);
}

export async function markQuoteRejectedInDb(
  id: string,
): Promise<Quote | null> {
  await assertCanMutateQuotesInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.markRejected(id);
}

export async function markQuoteExpiredInDb(
  id: string,
): Promise<Quote | null> {
  await assertCanOverrideQuoteStatusInDatabase();
  const { repo } = await quotesRepoForMutation();
  return repo.markExpired(id);
}

export async function reactivateQuoteInDb(id: string): Promise<Quote | null> {
  await assertCanOverrideQuoteStatusInDatabase();
  const { repo } = await quotesRepoForMutation();
  const settings = await createDbCompanySettingsRepository().get();
  return repo.reactivate(id, companyQuoteDefaultsFromSettings(settings));
}
