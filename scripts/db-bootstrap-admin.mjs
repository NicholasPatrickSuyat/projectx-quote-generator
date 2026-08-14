/**
 * One-time bootstrap for the first Admin user (M18).
 *
 * - No default password in Git
 * - Refuses if any app_users already exist
 * - Password via BOOTSTRAP_ADMIN_PASSWORD (temporary) or interactive prompt
 * - Never prints the password
 */

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;
const PASSWORD_MIN_LENGTH = 12;

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

function assertBootstrapAllowed() {
  const allow =
    (process.env.ALLOW_PRODUCTION_BOOTSTRAP ?? "").trim() === "1";
  const appEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  if ((appEnv === "production" || vercelEnv === "production") && !allow) {
    throw new Error(
      "db:bootstrap:admin refuses production unless ALLOW_PRODUCTION_BOOTSTRAP=1 (Gate 2 cutover only). Prefer interactive password; never leave BOOTSTRAP_ADMIN_PASSWORD set permanently.",
    );
  }
}

assertBootstrapAllowed();

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function requireDatabaseUrl() {
  const mode = (process.env.PERSISTENCE_MODE ?? "session").trim().toLowerCase();
  if (mode !== "database") {
    throw new Error(
      'Set PERSISTENCE_MODE=database (and DATABASE_URL) before running db:bootstrap:admin.',
    );
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for db:bootstrap:admin.");
  }
  return url;
}

async function readPassword() {
  const fromEnv = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (fromEnv != null && String(fromEnv).length > 0) {
    return String(fromEnv);
  }

  if (!input.isTTY) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD is required in non-interactive environments. Set it temporarily for this run only; do not commit it.",
    );
  }

  const rl = createInterface({ input, output });
  try {
    // readline does not hide input on all platforms; prefer env var in shared terminals.
    const password = await rl.question(
      `Admin password (min ${PASSWORD_MIN_LENGTH} chars; input may be visible): `,
    );
    return password;
  } finally {
    rl.close();
  }
}

const sql = neon(requireDatabaseUrl());

const companies = await sql`select id, name from company order by created_at asc limit 2`;
if (companies.length === 0) {
  throw new Error(
    "No company row found. Run npm run db:bootstrap:company first.",
  );
}
if (companies.length > 1) {
  throw new Error(
    "Multiple company rows found. Single-company installation required.",
  );
}

const companyId = companies[0].id;

const existing =
  await sql`select count(*)::int as count from app_users`;
if ((existing[0]?.count ?? 0) > 0) {
  throw new Error(
    "app_users already contains users. Refusing to create a second bootstrap Admin. Use an existing Admin to manage users, or reset passwords through the app.",
  );
}

const fullName =
  process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Administrator";
const email = normalizeEmail(
  process.env.BOOTSTRAP_ADMIN_EMAIL?.trim() || "admin@example.com",
);

if (!email || !email.includes("@")) {
  throw new Error("BOOTSTRAP_ADMIN_EMAIL must be a valid email address.");
}

const password = await readPassword();
if (password.length < PASSWORD_MIN_LENGTH) {
  throw new Error(
    `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`,
  );
}

const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

await sql`
  insert into app_users (
    company_id,
    full_name,
    email,
    password_hash,
    role,
    active,
    profile_picture
  ) values (
    ${companyId},
    ${fullName},
    ${email},
    ${passwordHash},
    ${"Admin"},
    ${true},
    ${null}
  )
`;

// Clear temporary env usage hint only in process memory — never log password.
if (process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
}

console.log("Bootstrap Admin created successfully.");
console.log(`  company: ${companies[0].name}`);
console.log(`  email:   ${email}`);
console.log(`  role:    Admin`);
console.log(
  "Unset BOOTSTRAP_ADMIN_PASSWORD if you used it. Do not commit secrets.",
);
