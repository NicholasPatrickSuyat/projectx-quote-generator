/**
 * Application user identity.
 *
 * Authentication for Version 1 demos is DEMO-ONLY (client session).
 * This model is intentionally auth-provider-agnostic so a future
 * server-side auth system can supply the same shape.
 */

export const USER_ROLES = ["Admin", "Office Staff"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  /** Soft deactivation — inactive users cannot sign in. */
  active: boolean;
  /**
   * Optional profile image URL/data URL.
   * Upload UI deferred; field kept for future use.
   */
  profilePicture: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserFormValues = {
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  /**
   * Create: required. Edit: empty means keep existing.
   * Demo mode stores plaintext in the session credential map (DEMO-ONLY).
   * Production mode hashes via bcryptjs on the server — never sent back to clients.
   */
  password: string;
};

export function userInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function isAdminRole(role: UserRole): boolean {
  return role === "Admin";
}
