/**
 * Persistence mode resolution (M17).
 *
 * - Default: session (public production remains session until M18+)
 * - database: requires DATABASE_URL; never silently falls back to session
 * - database mode is development / private-preview only in M17
 * - durable access/mutations refuse APP_ENV=production and VERCEL_ENV=production
 * - M18 adds real server authentication/authorization; do not treat demo login as security
 */

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

function assertNotPublicProductionDatabase(): void {
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "Database persistence is disabled on Vercel production (M17). Keep PERSISTENCE_MODE=session until M18.",
    );
  }
  if (getAppEnv() === "production") {
    throw new Error(
      "Database persistence is disabled when APP_ENV=production (M17). Keep production on PERSISTENCE_MODE=session until M18.",
    );
  }
}

/** Reads and writes — refuse public production database use in M17. */
export function assertDatabaseAccessAllowed(): void {
  if (getPersistenceMode() !== "database") {
    throw new Error("Database access requires PERSISTENCE_MODE=database.");
  }
  assertDatabaseUrlPresent();
  assertNotPublicProductionDatabase();
}

/** Mutations — same production refuse as access (explicit for M18 hook points). */
export function assertDatabaseMutationsAllowed(): void {
  assertDatabaseAccessAllowed();
}
