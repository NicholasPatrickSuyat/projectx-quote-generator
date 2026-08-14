/**
 * Explicit NON-PRODUCTION seed for M19 customers + quotes.
 * Refuses APP_ENV=production. Does not run on app startup.
 *
 * Usage (with PERSISTENCE_MODE=database + DATABASE_URL in .env.local):
 *   npm run db:seed:customers-quotes
 */
import { randomUUID } from "node:crypto";
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
  throw new Error(
    "db:seed:customers-quotes refuses to run when APP_ENV=production.",
  );
}

const mode = (process.env.PERSISTENCE_MODE ?? "session").trim().toLowerCase();
if (mode !== "database") {
  throw new Error(
    "Set PERSISTENCE_MODE=database (and DATABASE_URL) before seeding customers/quotes.",
  );
}

const url = process.env.DATABASE_URL?.trim();
if (!url) {
  throw new Error("DATABASE_URL is required for db:seed:customers-quotes.");
}

const sql = neon(url);
const companies = await sql`select id from company limit 2`;
if (companies.length === 0) {
  throw new Error("No company found. Run npm run db:bootstrap:company first.");
}
if (companies.length > 1) {
  throw new Error("Multiple companies found; aborting seed.");
}
const companyId = companies[0].id;

const existingCustomers =
  await sql`select count(*)::int as n from customers where company_id = ${companyId}`;
if (existingCustomers[0].n > 0) {
  console.log(
    `Skip customer/quote seed: ${existingCustomers[0].n} customer(s) already exist.`,
  );
  process.exit(0);
}

const customerId = randomUUID();
const quoteId = randomUUID();
const lineId = randomUUID();
const today = new Date().toISOString().slice(0, 10);

await sql`insert into entity_counters (company_id, entity_type, next_value)
  values (${companyId}, 'customer', 2)
  on conflict (company_id, entity_type) do update set next_value = greatest(entity_counters.next_value, 2)`;
await sql`insert into entity_counters (company_id, entity_type, next_value)
  values (${companyId}, 'quote', 2)
  on conflict (company_id, entity_type) do update set next_value = greatest(entity_counters.next_value, 2)`;

const snapshot = {
  customerId,
  customerNumber: "CUST-000001",
  customerName: "Jane Doe",
  companyName: "",
  phone: "(214) 555-0142",
  email: "jane.doe@email.com",
  street: "1200 Elm Street",
  city: "Dallas",
  state: "TX",
  zip: "75201",
};

await sql`
  insert into customers (
    id, company_id, customer_number, first_name, last_name, company_name,
    phone, email, street, city, state, zip, internal_notes, archived
  ) values (
    ${customerId}, ${companyId}, 'CUST-000001', 'Jane', 'Doe', '',
    '(214) 555-0142', 'jane.doe@email.com', '1200 Elm Street', 'Dallas', 'TX', '75201',
    'Non-production seed customer', false
  )
`;

await sql`
  insert into quotes (
    id, company_id, quote_number, customer_id, customer_snapshot,
    job_description, status, quote_date, valid_until, prepared_by,
    internal_notes, customer_message, terms_and_conditions,
    subtotal_cents, discount_type, discount_value, discount_cents,
    tax_rate, tax_cents, grand_total_cents, archived
  ) values (
    ${quoteId}, ${companyId}, 'QUO-000001', ${customerId}, ${JSON.stringify(snapshot)}::jsonb,
    'Seed draft quote for local database verification', 'Draft', ${today}, null, 'Alex Rivera',
    '', 'Thank you.', 'Seed terms.',
    15000, 'none', '0', 0,
    '0', 0, 15000, false
  )
`;

await sql`
  insert into quote_line_items (
    id, company_id, quote_id, category, description, quantity, unit,
    unit_price_cents, line_total_cents, internal_notes, sort_order
  ) values (
    ${lineId}, ${companyId}, ${quoteId}, 'Services', 'Diagnostic visit',
    '1', 'each', 15000, 15000, '', 0
  )
`;

console.log("Seeded non-production customer CUST-000001 and draft quote QUO-000001.");
