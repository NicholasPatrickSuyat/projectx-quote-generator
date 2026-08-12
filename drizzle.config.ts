import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "drizzle-kit";

/** Load local env files for drizzle-kit (does not override already-set vars). */
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

// Opt out for fail-fast tests (Windows cannot keep an empty env var set).
if (process.env.DRIZZLE_NO_DOTENV !== "1") {
  loadEnvFiles();
}

/**
 * Migrations / studio / push require DATABASE_URL_UNPOOLED (direct).
 * Never silently fall back to pooled DATABASE_URL.
 * `generate` may use a local placeholder when unpooled is unset.
 */
const argv = process.argv.join(" ");
const needsLiveUnpooled =
  /\b(migrate|push|studio|check|pull)\b/.test(argv) ||
  process.env.DRIZZLE_KIT_REQUIRE_UNPOOLED === "1";

const unpooled = process.env.DATABASE_URL_UNPOOLED?.trim();

if (needsLiveUnpooled && !unpooled) {
  throw new Error(
    "DATABASE_URL_UNPOOLED is required for drizzle-kit migrate/studio/push. Do not use pooled DATABASE_URL for migrations.",
  );
}

const url =
  unpooled || "postgresql://postgres:postgres@127.0.0.1:5432/postgres";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url,
  },
  strict: true,
  verbose: true,
});
