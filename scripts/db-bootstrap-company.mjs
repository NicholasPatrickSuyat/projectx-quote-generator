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

function assertNonProductionBootstrap() {
  const appEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();
  if (appEnv === "production") {
    throw new Error(
      "db:bootstrap:company refuses to run when APP_ENV=production (M17). Production auth/bootstrap belongs in M18+.",
    );
  }
  if (process.env.VERCEL_ENV === "production") {
    throw new Error(
      "db:bootstrap:company refuses to run on Vercel production (M17).",
    );
  }
}

function requireDatabaseUrl() {
  assertNonProductionBootstrap();
  const mode = (process.env.PERSISTENCE_MODE ?? "session").trim().toLowerCase();
  if (mode !== "database") {
    throw new Error(
      'Set PERSISTENCE_MODE=database (and DATABASE_URL) before running db:bootstrap:company.',
    );
  }
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is required for db:bootstrap:company.");
  return url;
}

const companyName =
  process.env.BOOTSTRAP_COMPANY_NAME?.trim() ||
  "Project X Mechanical Services";

const message =
  "Thank you for the opportunity to quote this work. Please review the details below and contact us with any questions.";
const terms =
  "This quote is valid until the date shown. Prices are estimates and may change if the scope of work changes. Payment terms to be agreed upon acceptance.";

const sql = neon(requireDatabaseUrl());

const companies = await sql`select id, name from company order by created_at asc limit 2`;
if (companies.length > 1) {
  throw new Error(
    "Multiple company rows found. M17 expects a single-company installation; fix the database manually.",
  );
}

if (companies.length === 1) {
  const companyId = companies[0].id;
  const settings =
    await sql`select company_id from company_settings where company_id = ${companyId} limit 1`;
  if (settings.length > 0) {
    console.log("Bootstrap skipped: company already exists.");
    process.exit(0);
  }

  // Recover a partial bootstrap (company without settings) in one statement.
  await sql`
    insert into company_settings (
      company_id,
      company_name,
      phone,
      email,
      website,
      street,
      city,
      state,
      zip,
      logo_json,
      currency,
      tax_rate,
      quote_validity_days,
      discount_type,
      discount_value,
      prepared_by,
      customer_facing_message,
      terms_and_conditions,
      pdf_footer_text
    ) values (
      ${companyId},
      ${companies[0].name || companyName},
      ${"(000) 000-0000"},
      ${"office@example.com"},
      ${""},
      ${"1 Main Street"},
      ${"Dallas"},
      ${"TX"},
      ${"75201"},
      ${null},
      ${"USD"},
      ${"0"},
      ${30},
      ${"none"},
      ${"0"},
      ${""},
      ${message},
      ${terms},
      ${companies[0].name || companyName}
    )
  `;
  console.log(
    `Bootstrap recovered: company_settings created for existing company ${companyId}.`,
  );
  process.exit(0);
}

// Atomic create: company + settings in a single statement (no partial row on failure).
const created = await sql`
  with new_company as (
    insert into company (name)
    values (${companyName})
    returning id, name
  )
  insert into company_settings (
    company_id,
    company_name,
    phone,
    email,
    website,
    street,
    city,
    state,
    zip,
    logo_json,
    currency,
    tax_rate,
    quote_validity_days,
    discount_type,
    discount_value,
    prepared_by,
    customer_facing_message,
    terms_and_conditions,
    pdf_footer_text
  )
  select
    id,
    name,
    ${"(000) 000-0000"},
    ${"office@example.com"},
    ${""},
    ${"1 Main Street"},
    ${"Dallas"},
    ${"TX"},
    ${"75201"},
    ${null},
    ${"USD"},
    ${"0"},
    ${30},
    ${"none"},
    ${"0"},
    ${""},
    ${message},
    ${terms},
    name
  from new_company
  returning company_id
`;

console.log(
  `Bootstrap complete: company ${created[0].company_id} (${companyName}).`,
);
