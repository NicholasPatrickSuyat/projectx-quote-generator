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

const appEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();
if (appEnv === "production") {
  throw new Error("db:seed:demo refuses to run when APP_ENV=production.");
}

const mode = (process.env.PERSISTENCE_MODE ?? "session").trim().toLowerCase();
if (mode !== "database") {
  throw new Error(
    'Set PERSISTENCE_MODE=database (and DATABASE_URL) before running db:seed:demo.',
  );
}
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("DATABASE_URL is required for db:seed:demo.");

const sql = neon(url);
const companies = await sql`select id from company limit 2`;
if (companies.length === 0) {
  throw new Error("No company found. Run npm run db:bootstrap:company first.");
}
if (companies.length > 1) {
  throw new Error("Multiple companies found; aborting demo seed.");
}
const companyId = companies[0].id;

const demo = {
  companyName: "Project X Mechanical Services",
  phone: "(214) 555-0190",
  email: "quotes@projectxdemo.com",
  website: "https://www.projectxdemo.com",
  street: "4800 Main Street",
  city: "Dallas",
  state: "TX",
  zip: "75201",
  taxRate: "0",
  quoteValidityDays: 30,
  discountType: "none",
  discountValue: "0",
  preparedBy: "Alex Rivera",
  customerFacingMessage:
    "Thank you for the opportunity to quote this work. Please review the details below and contact us with any questions.",
  termsAndConditions:
    "This quote is valid until the date shown. Prices are estimates and may change if the scope of work changes. Payment terms to be agreed upon acceptance.",
  pdfFooterText:
    "Project X Mechanical Services · Dallas, TX · quotes@projectxdemo.com",
};

await sql`
  update company_settings set
    company_name = ${demo.companyName},
    phone = ${demo.phone},
    email = ${demo.email},
    website = ${demo.website},
    street = ${demo.street},
    city = ${demo.city},
    state = ${demo.state},
    zip = ${demo.zip},
    logo_json = ${null},
    currency = ${"USD"},
    tax_rate = ${demo.taxRate},
    quote_validity_days = ${demo.quoteValidityDays},
    discount_type = ${demo.discountType},
    discount_value = ${demo.discountValue},
    prepared_by = ${demo.preparedBy},
    customer_facing_message = ${demo.customerFacingMessage},
    terms_and_conditions = ${demo.termsAndConditions},
    pdf_footer_text = ${demo.pdfFooterText},
    updated_at = now()
  where company_id = ${companyId}
`;

await sql`
  update company set name = ${demo.companyName}, updated_at = now()
  where id = ${companyId}
`;

/** Minimal subset of demo catalog for optional seed (no customers/quotes). */
const catalog = [
  ["CAT-001", "Diagnostic Fee", "Services", "ea", 12900, "On-site diagnostic and system evaluation"],
  ["CAT-002", "Thermostat Installation", "Services", "ea", 28500, "Smart thermostat install and configuration"],
  ["CAT-003", "Furnace Tune-Up", "Services", "ea", 18900, "Seasonal furnace inspection and tune-up"],
  ["CAT-004", "AC Condenser Unit", "Materials", "ea", 245000, "Standard outdoor condenser unit"],
  ["CAT-005", "Evaporator Coil", "Materials", "ea", 87500, "Matched evaporator coil"],
  ["CAT-010", "Install Labor", "Labor", "hr", 11000, "Installation labor"],
];

let inserted = 0;
let skipped = 0;
for (const [id, name, category, unit, cents, description] of catalog) {
  const existing = await sql`select id from catalog_items where id = ${id} limit 1`;
  if (existing.length > 0) {
    skipped += 1;
    continue;
  }
  await sql`
    insert into catalog_items (
      id, company_id, name, category, description, unit, unit_price_cents, archived
    ) values (
      ${id}, ${companyId}, ${name}, ${category}, ${description}, ${unit}, ${cents}, ${false}
    )
  `;
  inserted += 1;
}

console.log(
  `Demo seed complete: settings updated; catalog inserted=${inserted}, skipped=${skipped}.`,
);
