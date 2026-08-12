/**
 * Verify bootstrap Admin row (no secrets printed).
 * node scripts/m18-verify-admin.mjs
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
const sql = neon(process.env.DATABASE_URL.trim());

const rows = await sql`
  select
    count(*)::int as count,
    min(email) as email,
    bool_and(email = lower(email)) as email_normalized,
    bool_and(password_hash like '$2%') as bcrypt_like,
    bool_and(auth_version = 1) as auth_version_one,
    bool_and(role = 'Admin') as all_admin,
    bool_and(active) as all_active
  from app_users
`;

const cols = await sql`
  select column_name from information_schema.columns
  where table_name = 'app_users'
`;
const hasPlaintext = cols.some((c) =>
  ["password", "plaintext_password", "demo_password"].includes(c.column_name),
);

console.log("USER_COUNT", rows[0].count);
console.log("EMAIL", rows[0].email);
console.log("EMAIL_NORMALIZED", rows[0].email_normalized);
console.log("BCRYPT_HASH_PRESENT", rows[0].bcrypt_like);
console.log("AUTH_VERSION_STARTS_AT_1", rows[0].auth_version_one);
console.log("ROLE_ADMIN", rows[0].all_admin);
console.log("ACTIVE", rows[0].all_active);
console.log("NO_PLAINTEXT_PASSWORD_COLUMN", !hasPlaintext);
