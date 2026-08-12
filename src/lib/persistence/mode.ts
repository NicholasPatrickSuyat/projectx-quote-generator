/**
 * Persistence mode resolution (M17/M18).
 *
 * - Default: session (public production until deliberate cutover)
 * - database: requires DATABASE_URL; never silently falls back to session
 * - AUTH_MODE=demo + PERSISTENCE_MODE=database: **local development only**
 *   (APP_ENV=development, non-Vercel-preview/production). Fail closed otherwise.
 * - AUTH_MODE=production: deliberate cutover may use database on production hosts
 */

import { getAuthMode } from "@/lib/auth/mode";

export type PersistenceMode = "session" | "database";

export type AppEnv = "development" | "preview" | "production" | "unknown";

export function getAppEnv(): AppEnv {
  const raw = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (raw === "development" || raw === "preview" || raw === "production") {
    return raw;
  }
  if (process.env.NODE_ENV === "production") return "production";
  if (process.env.NODE_ENV === "development") return "development";
  return "unknown";
}

export function getPersistenceMode(): PersistenceMode {
  const raw = (process.env.PERSISTENCE_MODE ?? "").trim().toLowerCase();
  if (!raw || raw === "session") return "session";
  if (raw === "database") return "database";
  throw new Error(
    `Invalid PERSISTENCE_MODE="${process.env.PERSISTENCE_MODE}". Use "session" or "database".`,
  );
}

export function isDatabasePersistence(): boolean {
  return getPersistenceMode() === "database";
}

/**
 * When PERSISTENCE_MODE=database, DATABASE_URL must be set.
 * Throws a clear configuration error — never falls back to session.
 */
export function assertDatabaseUrlPresent(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "PERSISTENCE_MODE=database requires DATABASE_URL (Neon pooled connection). Refusing to fall back to session mode.",
    );
  }
  return url;
}

/**
 * AUTH_MODE=demo + PERSISTENCE_MODE=database is local-development only.
 * Preview/production-like hosts must use session demo or production auth.
 */
function assertDemoDatabaseOnlyLocalDevelopment(): void {
  if (getAuthMode() === "production") {
    return;
  }

  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview") {
    throw new Error(
      `AUTH_MODE=demo with PERSISTENCE_MODE=database is refused on Vercel ${vercelEnv}. Use PERSISTENCE_MODE=session for demo, or AUTH_MODE=production for authorized database access.`,
    );
  }

  const appEnv = getAppEnv();
  if (appEnv !== "development") {
    throw new Error(
      `AUTH_MODE=demo with PERSISTENCE_MODE=database is allowed only for APP_ENV=development (local). Current APP_ENV=${appEnv}. Use PERSISTENCE_MODE=session for demo, or AUTH_MODE=production with Auth.js for database hosts.`,
    );
  }
}

/** Reads — demo+database only in local development; production auth uses Auth.js path. */
export function assertDatabaseAccessAllowed(): void {
  if (getPersistenceMode() !== "database") {
    throw new Error("Database access requires PERSISTENCE_MODE=database.");
  }
  assertDatabaseUrlPresent();
  assertDemoDatabaseOnlyLocalDevelopment();
}

/**
 * Mutations — require AUTH_MODE=production so demo auth cannot authorize
 * durable Settings/Catalog/Users writes.
 */
export function assertDatabaseMutationsAllowed(): void {
  assertDatabaseAccessAllowed();
  if (getAuthMode() !== "production") {
    throw new Error(
      "Database mutations require AUTH_MODE=production. Demo authentication cannot authorize durable writes.",
    );
  }
}
