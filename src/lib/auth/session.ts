/**
 * Server authorization helpers (M18).
 * Privileged actions always reload the user from the database —
 * never trust JWT role/capability alone for mutations.
 */

import { auth } from "@/auth";
import {
  capabilitiesForRole,
  type RoleCapabilities,
} from "@/lib/auth/capabilities";
import { getAuthMode, assertProductionAuthConfigured } from "@/lib/auth/mode";
import {
  findUserAuthStateById,
  type AppUserAuthState,
} from "@/lib/persistence/db-users-repository";
import {
  assertDatabaseAccessAllowed,
  assertDatabaseMutationsAllowed,
} from "@/lib/persistence/mode";
import { isAdminRole } from "@/types/user";

export class AuthorizationError extends Error {
  readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "INACTIVE" | "SESSION_REVOKED";

  constructor(
    code: "UNAUTHENTICATED" | "FORBIDDEN" | "INACTIVE" | "SESSION_REVOKED",
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
    this.code = code;
  }
}

export type AuthorizedUser = AppUserAuthState;

/** JWT identity only — not authoritative for role/active/version. */
export async function requireAuthenticatedUser(): Promise<{
  id: string;
  email: string;
  authVersion: number | undefined;
}> {
  assertProductionAuthConfigured();
  const session = await auth();
  const id = session?.user?.id;
  const email = session?.user?.email;
  if (!id || !email || session.error === "SessionInvalid") {
    throw new AuthorizationError(
      "UNAUTHENTICATED",
      "You must be signed in to perform this action.",
    );
  }
  return {
    id,
    email,
    authVersion: session.user.authVersion,
  };
}

/**
 * Reload authoritative user from DB; deny inactive / missing / revoked JWT.
 * Use for all privileged server operations (reads and writes in production).
 */
export async function requireActiveUser(): Promise<AuthorizedUser> {
  const sessionUser = await requireAuthenticatedUser();
  const row = await findUserAuthStateById(sessionUser.id);
  if (!row) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
  if (!row.active) {
    throw new AuthorizationError(
      "INACTIVE",
      "This account is inactive.",
    );
  }
  if (
    sessionUser.authVersion !== undefined &&
    sessionUser.authVersion !== row.authVersion
  ) {
    throw new AuthorizationError(
      "SESSION_REVOKED",
      "Your session is no longer valid. Please sign in again.",
    );
  }
  return row;
}

/** Ensure the authenticated user belongs to the installation company. */
export async function assertUserBelongsToCompany(
  user: AuthorizedUser,
  companyId: string,
): Promise<void> {
  if (user.companyId !== companyId) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
}

export async function requireCapability(
  capability: keyof RoleCapabilities,
): Promise<{ user: AuthorizedUser; capabilities: RoleCapabilities }> {
  const user = await requireActiveUser();
  const capabilities = capabilitiesForRole(user.role);
  if (!capabilities[capability]) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
  return { user, capabilities };
}

export async function requireAdmin(): Promise<AuthorizedUser> {
  const { user } = await requireCapability("canManageUsers");
  if (!isAdminRole(user.role)) {
    throw new AuthorizationError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
    );
  }
  return user;
}

/** Durable Settings/Catalog/Users writes: production auth + capability. */
export async function requireDatabaseMutationCapability(
  capability: keyof RoleCapabilities,
): Promise<{ user: AuthorizedUser; capabilities: RoleCapabilities }> {
  assertDatabaseMutationsAllowed();
  return requireCapability(capability);
}

/**
 * Durable Settings read (production): Admin only via canManageSettings.
 * Demo + database hybrid: access-allowed without Auth.js (demo has no server session).
 */
export async function requireDatabaseSettingsRead(): Promise<AuthorizedUser | null> {
  assertDatabaseAccessAllowed();
  if (getAuthMode() !== "production") {
    return null;
  }
  const { user } = await requireCapability("canManageSettings");
  return user;
}

/**
 * Durable Catalog read (production): any authenticated active user (Admin + Staff).
 * Demo + database hybrid: access-allowed without Auth.js.
 */
export async function requireDatabaseCatalogRead(): Promise<AuthorizedUser | null> {
  assertDatabaseAccessAllowed();
  if (getAuthMode() !== "production") {
    return null;
  }
  return requireActiveUser();
}

/**
 * Durable Users list/read (production): Admin via canManageUsers.
 * Not available under demo auth for database users.
 */
export async function requireDatabaseUsersRead(): Promise<AuthorizedUser> {
  assertDatabaseAccessAllowed();
  assertProductionAuthConfigured();
  const { user } = await requireCapability("canManageUsers");
  return user;
}
