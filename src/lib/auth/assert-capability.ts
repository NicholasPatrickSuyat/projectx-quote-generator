/**
 * M17 authorization boundary for durable mutations.
 *
 * ACCEPTED DEFERRED TO M18: real Auth.js session + capability checks.
 * M17 does NOT implement forgeable demo-auth cookies or pretend demo login
 * is server security.
 *
 * M17 safety boundary (already enforced by assertDatabaseMutationsAllowed):
 * - PERSISTENCE_MODE=database required
 * - DATABASE_URL required (no silent session fallback)
 * - refused when APP_ENV=production or VERCEL_ENV=production
 *
 * Database mode is development / private-preview only until M18.
 */

import { assertDatabaseMutationsAllowed } from "@/lib/persistence/mode";

export function assertCanManageSettingsForDatabaseMutation(): void {
  assertDatabaseMutationsAllowed();
  // M18: resolve server session → capabilities.canManageSettings
}

export function assertCanManageCatalogForDatabaseMutation(): void {
  assertDatabaseMutationsAllowed();
  // M18: resolve server session → capabilities.canManageCatalog
}
