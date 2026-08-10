/**
 * =============================================================================
 * DEMO-ONLY AUTHENTICATION
 * =============================================================================
 *
 * This module intentionally implements insecure, client-side demo login for
 * local demos and stakeholder walkthroughs.
 *
 * It is NOT production security:
 * - Credentials may live in the browser session
 * - Passwords are compared in plaintext on the client
 * - Route/UI guards can be bypassed by a determined user
 *
 * Replace this module (and DemoAuthSessionProvider) with real server-side
 * authentication later. Keep capability helpers and UI gates unchanged.
 * =============================================================================
 */

export const DEMO_AUTH_STORAGE_KEY = "qg-demo-auth-user-id";

/** Well-known demo login emails (also used as credential map keys). */
export const DEMO_ADMIN_EMAIL = "alex.admin@demo.projectx.local";
export const DEMO_STAFF_EMAIL = "jordan.staff@demo.projectx.local";

/**
 * DEMO-ONLY plaintext secrets for seed users.
 * Do not reuse these values outside the demo environment.
 */
export const DEMO_SEED_PASSWORDS: Record<string, string> = {
  [DEMO_ADMIN_EMAIL]: "DemoAdmin!23",
  [DEMO_STAFF_EMAIL]: "DemoStaff!23",
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function readDemoAuthUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(DEMO_AUTH_STORAGE_KEY);
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export function writeDemoAuthUserId(userId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (userId) {
      window.sessionStorage.setItem(DEMO_AUTH_STORAGE_KEY, userId);
    } else {
      window.sessionStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    }
  } catch {
    // sessionStorage may be unavailable; session stays in-memory only
  }
}
