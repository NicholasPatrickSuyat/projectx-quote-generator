/**
 * M18 security smoke checks (no secrets printed).
 * Run: node scripts/m18-security-smoke.mjs
 *
 * Always covers mode fail-fast + demo write refusal.
 * When AUTH_MODE=production + PERSISTENCE_MODE=database + DATABASE_URL are set
 * (local/non-production only), also exercises auth_version bump semantics via SQL.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFiles(files = [".env.local", ".env"]) {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

loadEnvFiles();

function getAuthMode() {
  const raw = (process.env.AUTH_MODE ?? "").trim().toLowerCase();
  if (!raw || raw === "demo") return "demo";
  if (raw === "production") return "production";
  throw new Error(`Invalid AUTH_MODE`);
}

function assertMutationsAllowed(authMode) {
  if (authMode !== "production") {
    throw new Error(
      "Database mutations require AUTH_MODE=production. Demo authentication cannot authorize durable writes.",
    );
  }
}

const results = [];

function pass(name) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}

function fail(name, err) {
  results.push({ name, ok: false, err: String(err) });
  console.error(`FAIL  ${name}: ${err}`);
}

const savedAuthMode = process.env.AUTH_MODE;

try {
  delete process.env.AUTH_MODE;
  if (getAuthMode() !== "demo") throw new Error("expected demo default");
  pass("AUTH_MODE default demo");
} catch (e) {
  fail("AUTH_MODE default demo", e);
}

try {
  process.env.AUTH_MODE = "demo";
  assertMutationsAllowed(getAuthMode());
  fail("demo mutations blocked", "should have thrown");
} catch {
  pass("demo mutations blocked");
}

try {
  process.env.AUTH_MODE = "weird";
  getAuthMode();
  fail("invalid AUTH_MODE fail-fast", "should have thrown");
} catch {
  pass("invalid AUTH_MODE fail-fast");
}

// Restore env from files (allow override after our temporary mutations).
delete process.env.AUTH_MODE;
loadEnvFiles();
// Prefer file value; fall back to original process env if files left it unset.
if (process.env.AUTH_MODE === undefined && savedAuthMode !== undefined) {
  process.env.AUTH_MODE = savedAuthMode;
}

const liveMode = (() => {
  try {
    return getAuthMode();
  } catch {
    return "invalid";
  }
})();
const persistence = (process.env.PERSISTENCE_MODE ?? "session")
  .trim()
  .toLowerCase();
const hasDb = Boolean(process.env.DATABASE_URL?.trim());
const vercelProd = process.env.VERCEL_ENV === "production";
const appProd =
  (process.env.APP_ENV ?? "").trim().toLowerCase() === "production";

if (liveMode === "production" && persistence === "database" && hasDb) {
  if (vercelProd || appProd) {
    console.log(
      "SKIP  production DB auth_version checks (refusing APP_ENV/VERCEL production)",
    );
  } else {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    try {
      const cols = await sql`
        select column_name from information_schema.columns
        where table_name = 'app_users' and column_name = 'auth_version'
      `;
      if (cols.length === 0) {
        fail(
          "auth_version column present",
          "column missing — apply drizzle/0002_app_users_auth_version.sql locally",
        );
      } else {
        pass("auth_version column present");
      }

      const users = await sql`
        select id, auth_version, active, role from app_users order by created_at asc limit 5
      `;
      if (users.length === 0) {
        console.log(
          "SKIP  auth_version bump (no app_users — run db:bootstrap:admin)",
        );
      } else {
        const target = users[0];
        const before = Number(target.auth_version);
        // Dry bump in a transaction-like pair: increment then restore
        await sql`
          update app_users
          set auth_version = auth_version + 1, updated_at = now()
          where id = ${target.id}
        `;
        const mid = await sql`
          select auth_version from app_users where id = ${target.id} limit 1
        `;
        const bumped = Number(mid[0].auth_version);
        if (bumped !== before + 1) {
          fail("auth_version increments", `expected ${before + 1} got ${bumped}`);
        } else {
          pass("auth_version increments");
        }
        // Restore exact prior version for non-destructive smoke
        await sql`
          update app_users
          set auth_version = ${before}, updated_at = now()
          where id = ${target.id}
        `;
        pass("auth_version restore after smoke bump");
      }
    } catch (e) {
      fail("production DB smoke", e.message || e);
    }
  }
} else {
  console.log(
    `SKIP  production DB auth_version checks (mode=${liveMode}, persistence=${persistence}, hasDb=${hasDb})`,
  );
  console.log(
    "      Set local AUTH_MODE=production PERSISTENCE_MODE=database + migrate/bootstrap to exercise.",
  );
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length > 0) process.exit(1);
