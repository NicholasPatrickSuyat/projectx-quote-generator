/**
 * M18 authorization boundary for durable Settings/Catalog/Users access.
 *
 * AUTH_MODE=production: Auth.js session + DB re-check + capabilitiesForRole.
 * AUTH_MODE=demo: durable DB writes refused; hybrid DB reads remain demo-local.
 *
 * Never trust client-submitted role, user id, or capability flags.
 */

import {
  requireDatabaseCatalogRead,
  requireDatabaseMutationCapability,
  requireDatabaseSettingsRead,
} from "@/lib/auth/session";

export async function assertCanReadSettingsFromDatabase(): Promise<void> {
  await requireDatabaseSettingsRead();
}

export async function assertCanReadCatalogFromDatabase(): Promise<void> {
  await requireDatabaseCatalogRead();
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
