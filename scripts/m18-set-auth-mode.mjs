/**
 * Toggle local AUTH_MODE in .env.local without printing secrets.
 * Usage:
 *   node scripts/m18-set-auth-mode.mjs production
 *   node scripts/m18-set-auth-mode.mjs demo
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const mode = (process.argv[2] || "").trim().toLowerCase();
if (mode !== "production" && mode !== "demo") {
  console.error("Usage: node scripts/m18-set-auth-mode.mjs <production|demo>");
  process.exit(1);
}

const envPath = resolve(process.cwd(), ".env.local");
if (!existsSync(envPath)) {
  console.error(".env.local missing");
  process.exit(1);
}

let text = readFileSync(envPath, "utf8");

function upsert(key, value) {
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(text)) text = text.replace(re, line);
  else {
    if (!text.endsWith("\n")) text += "\n";
    text += `${line}\n`;
  }
}

upsert("AUTH_MODE", mode);
upsert("APP_ENV", "development");

if (mode === "production") {
  upsert("PERSISTENCE_MODE", "database");
  upsert("M18_AUTH_PROBE", "1");
  if (!/^AUTH_SECRET=.+/m.test(text)) {
    console.error("AUTH_SECRET missing in .env.local — run m18-prepare-local-auth-env.mjs first");
    process.exit(1);
  }
} else {
  upsert("PERSISTENCE_MODE", "session");
  // Leave M18_AUTH_PROBE unset/off for demo
  upsert("M18_AUTH_PROBE", "0");
}

writeFileSync(envPath, text, "utf8");
console.log(`AUTH_MODE=${mode}`);
console.log(
  `PERSISTENCE_MODE=${mode === "production" ? "database" : "session"}`,
);
console.log("APP_ENV=development");
