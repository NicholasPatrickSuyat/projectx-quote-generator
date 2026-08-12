/**
 * Verify M18 schema after migrate. Never prints connection strings or secrets.
 * node scripts/m18-verify-schema.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

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

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = neon(url);

const tables = await sql`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'app_users',
      'company',
      'company_settings',
      'catalog_items',
      'customers',
      'quotes',
      'quote_line_items'
    )
  order by table_name
`;
console.log("TABLES", tables.map((r) => r.table_name).join(","));

const cols = await sql`
  select column_name, data_type
  from information_schema.columns
  where table_name = 'app_users'
  order by ordinal_position
`;
console.log(
  "APP_USERS_COLS",
  cols.map((c) => `${c.column_name}:${c.data_type}`).join(" | "),
);

const hasAuthVersion = cols.some((c) => c.column_name === "auth_version");
console.log("HAS_AUTH_VERSION", hasAuthVersion);

const drizzleTables = await sql`
  select tablename from pg_tables where schemaname = 'drizzle'
`;
console.log(
  "DRIZZLE_META_TABLES",
  drizzleTables.map((r) => r.tablename).join(",") || "(none)",
);

try {
  const migrations = await sql`
    select id, hash, created_at from drizzle.__drizzle_migrations order by created_at
  `;
  console.log("MIGRATION_COUNT", migrations.length);
} catch {
  console.log("MIGRATION_COUNT", "unavailable");
}

const users = await sql`select count(*)::int as c from app_users`;
const companies = await sql`select count(*)::int as c from company`;
console.log("APP_USERS_COUNT", users[0].c);
console.log("COMPANY_COUNT", companies[0].c);

const forbidden = tables.filter((t) =>
  ["customers", "quotes", "quote_line_items"].includes(t.table_name),
);
console.log("M19_TABLES_ABSENT", forbidden.length === 0);
