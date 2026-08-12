/**
 * Prepare local NON-PRODUCTION .env.local keys for M18 production-auth testing.
 * Generates AUTH_SECRET + temporary bootstrap/test passwords if missing.
 * Never prints secret values.
 *
 * node scripts/m18-prepare-local-auth-env.mjs
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomBytes } from "node:crypto";

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error(".env.local not found");
  process.exit(1);
}

let text = readFileSync(envPath, "utf8");

function hasKey(key) {
  return new RegExp(`^${key}=.`, "m").test(text);
}

function upsert(key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(text)) {
    text = text.replace(re, line);
  } else {
    if (!text.endsWith("\n")) text += "\n";
    text += `${line}\n`;
  }
}

const generated = [];

if (!hasKey("AUTH_SECRET")) {
  upsert("AUTH_SECRET", randomBytes(32).toString("base64url"));
  generated.push("AUTH_SECRET");
}

if (!hasKey("BOOTSTRAP_ADMIN_EMAIL")) {
  upsert("BOOTSTRAP_ADMIN_EMAIL", "m18.admin@test.projectx.local");
  generated.push("BOOTSTRAP_ADMIN_EMAIL");
}

if (!hasKey("BOOTSTRAP_ADMIN_NAME")) {
  upsert("BOOTSTRAP_ADMIN_NAME", "M18 Test Admin");
  generated.push("BOOTSTRAP_ADMIN_NAME");
}

if (!hasKey("BOOTSTRAP_ADMIN_PASSWORD")) {
  // Temporary local test secret — stays in gitignored .env.local only.
  upsert(
    "BOOTSTRAP_ADMIN_PASSWORD",
    `M18a-${randomBytes(18).toString("base64url")}`,
  );
  generated.push("BOOTSTRAP_ADMIN_PASSWORD");
}

if (!hasKey("M18_TEST_STAFF_EMAIL")) {
  upsert("M18_TEST_STAFF_EMAIL", "m18.staff@test.projectx.local");
  generated.push("M18_TEST_STAFF_EMAIL");
}

if (!hasKey("M18_TEST_STAFF_PASSWORD")) {
  upsert(
    "M18_TEST_STAFF_PASSWORD",
    `M18s-${randomBytes(18).toString("base64url")}`,
  );
  generated.push("M18_TEST_STAFF_PASSWORD");
}

// Snapshot production-auth overrides used for local E2E (caller switches AUTH_MODE).
upsert("APP_ENV", "development");

writeFileSync(envPath, text, "utf8");
console.log("Updated .env.local (gitignored). Generated keys:", generated.join(", ") || "(none — already present)");
console.log("Emails configured (non-secret):");
const emailAdmin = (text.match(/^BOOTSTRAP_ADMIN_EMAIL=(.*)$/m) || [])[1];
const emailStaff = (text.match(/^M18_TEST_STAFF_EMAIL=(.*)$/m) || [])[1];
console.log("  admin:", emailAdmin);
console.log("  staff:", emailStaff);
