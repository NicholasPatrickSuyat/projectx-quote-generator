import type { UserRole } from "@/types/user";
import { isAdminRole } from "@/types/user";

/**
 * Centralized RBAC capabilities.
 *
 * Derive all feature gates from these helpers instead of comparing
 * role strings in components. When real server auth arrives, the same
 * capability object can be populated from the server session.
 */
export type RoleCapabilities = {
  canManageUsers: boolean;
  canManageSettings: boolean;
  canManageCatalog: boolean;
  /** Admin-only quote status overrides (e.g. manual expire, reactivate). */
  canOverrideQuoteStatus: boolean;
  /** Admin-only restore of archived customers/quotes. */
  canRestore: boolean;
  canOverridePreparedBy: boolean;
};

export function capabilitiesForRole(role: UserRole): RoleCapabilities {
  const admin = isAdminRole(role);
  return {
    canManageUsers: admin,
    canManageSettings: admin,
    canManageCatalog: admin,
    canOverrideQuoteStatus: admin,
    canRestore: admin,
    canOverridePreparedBy: admin,
  };
}

export const EMPTY_CAPABILITIES: RoleCapabilities = {
  canManageUsers: false,
  canManageSettings: false,
  canManageCatalog: false,
  canOverrideQuoteStatus: false,
  canRestore: false,
  canOverridePreparedBy: false,
};
