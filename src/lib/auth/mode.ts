/**
 * Authentication mode (M18 cutover control).
 *
 * AUTH_MODE=demo (default) — M13 DEMO-ONLY login; cannot authorize durable DB writes.
 * AUTH_MODE=production — Auth.js + app_users; real server authorization.
 *
 * Temporary migration mechanism — not a permanent dual-auth architecture.
 * Never silently fall back from production → demo.
 */

export type AuthMode = "demo" | "production";

export function getAuthMode(): AuthMode {
  const raw = (process.env.AUTH_MODE ?? "").trim().toLowerCase();
  if (!raw || raw === "demo") return "demo";
  if (raw === "production") return "production";
  throw new Error(
    `Invalid AUTH_MODE="${process.env.AUTH_MODE}". Use "demo" or "production".`,
  );
}

export function isProductionAuthMode(): boolean {
  return getAuthMode() === "production";
}

/** Fail fast when production auth is selected without AUTH_SECRET. */
export function assertAuthSecretPresent(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "AUTH_MODE=production requires AUTH_SECRET. Refusing to start production authentication without a secret.",
    );
  }
  return secret;
}

export function assertProductionAuthConfigured(): void {
  if (getAuthMode() !== "production") {
    throw new Error("This operation requires AUTH_MODE=production.");
  }
  assertAuthSecretPresent();
  const persistence = (process.env.PERSISTENCE_MODE ?? "")
    .trim()
    .toLowerCase();
  if (persistence !== "database") {
    throw new Error(
      "AUTH_MODE=production requires PERSISTENCE_MODE=database.",
    );
  }
}
