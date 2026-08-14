/**
 * M18/M19 authorization boundary for durable Settings/Catalog/Users/Customers/Quotes.
 *
 * AUTH_MODE=production: Auth.js session + DB re-check + capabilitiesForRole.
 * AUTH_MODE=demo: durable DB writes refused; hybrid DB reads remain demo-local.
 *
 * Never trust client-submitted role, user id, or capability flags.
 */

import {
  AuthorizationError,
  requireDatabaseCatalogRead,
  requireDatabaseCustomerMutation,
  requireDatabaseCustomersRead,
  requireDatabaseMutationCapability,
  requireDatabaseQuoteMutation,
  requireDatabaseQuotesRead,
  requireDatabaseSettingsRead,
} from "@/lib/auth/session";

export async function assertCanReadSettingsFromDatabase(): Promise<void> {
  await requireDatabaseSettingsRead();
}

export async function assertCanReadCatalogFromDatabase(): Promise<void> {
  await requireDatabaseCatalogRead();
}

export async function assertCanReadCustomersFromDatabase(): Promise<void> {
  await requireDatabaseCustomersRead();
}

export async function assertCanReadQuotesFromDatabase(): Promise<void> {
  await requireDatabaseQuotesRead();
}

export async function assertCanManageSettingsForDatabaseMutation(): Promise<void> {
  await requireDatabaseMutationCapability("canManageSettings");
}

export async function assertCanManageCatalogForDatabaseMutation(): Promise<void> {
  await requireDatabaseMutationCapability("canManageCatalog");
}

export async function assertCanManageUsersForDatabaseMutation(): Promise<void> {
  await requireDatabaseMutationCapability("canManageUsers");
}

export async function assertCanMutateCustomersInDatabase(): Promise<void> {
  await requireDatabaseCustomerMutation();
}

export async function assertCanRestoreCustomerInDatabase(): Promise<void> {
  const { capabilities } = await requireDatabaseCustomerMutation();
  if (!capabilities.canRestore) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}

export async function assertCanMutateQuotesInDatabase(): Promise<void> {
  await requireDatabaseQuoteMutation();
}

export async function assertCanRestoreQuoteInDatabase(): Promise<void> {
  const { capabilities } = await requireDatabaseQuoteMutation();
  if (!capabilities.canRestore) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}

export async function assertCanOverrideQuoteStatusInDatabase(): Promise<void> {
  const { capabilities } = await requireDatabaseQuoteMutation();
  if (!capabilities.canOverrideQuoteStatus) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}