/**
 * Server-only Neon + Drizzle client.
 * Never import this module from Client Components.
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/db/schema";
import {
  assertDatabaseUrlPresent,
  getPersistenceMode,
} from "@/lib/persistence/mode";
import { assertServerModule } from "@/lib/server-module";

assertServerModule("@/lib/db/client");

export type AppDatabase = ReturnType<typeof createDb>;

function createDb(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return drizzle({ client: sql, schema });
}

let cached: AppDatabase | null = null;
let cachedUrl: string | null = null;

/** Returns a Drizzle client; only valid when PERSISTENCE_MODE=database. */
export function getDb(): AppDatabase {
  assertServerModule("@/lib/db/client");
  if (getPersistenceMode() !== "database") {
    throw new Error(
      "getDb() requires PERSISTENCE_MODE=database. Session mode must not open a database connection.",
    );
  }
  const url = assertDatabaseUrlPresent();
  if (cached && cachedUrl === url) return cached;
  cached = createDb(url);
  cachedUrl = url;
  return cached;
}
