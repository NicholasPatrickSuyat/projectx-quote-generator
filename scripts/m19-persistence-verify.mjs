/**
 * M19 non-production persistence verification (Pool transactions, no Auth.js).
 * Never prints secrets. Refuses APP_ENV=production.
 *
 *   PERSISTENCE_MODE=database node scripts/m19-persistence-verify.mjs
 */
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Pool } from "@neondatabase/serverless";

function loadEnvFiles(files = [".env.local", ".env"]) {
  for (const file of files) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx <= 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
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

if ((process.env.APP_ENV ?? "").trim().toLowerCase() === "production") {
  throw new Error("m19-persistence-verify refuses APP_ENV=production.");
}
if ((process.env.PERSISTENCE_MODE ?? "").trim().toLowerCase() !== "database") {
  throw new Error("Set PERSISTENCE_MODE=database before running this script.");
}
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("DATABASE_URL required.");

const pool = new Pool({ connectionString: url });
const results = [];
function pass(name) {
  results.push({ name, ok: true });
  console.log(`PASS  ${name}`);
}
function fail(name, err) {
  results.push({ name, ok: false, err: String(err) });
  console.error(`FAIL  ${name}: ${err}`);
}
function assert(cond, name, detail = "") {
  if (cond) pass(name);
  else fail(name, detail || "assertion failed");
}

function formatNumber(prefix, value) {
  return `${prefix}${String(value).padStart(6, "0")}`;
}

async function allocate(client, companyId, entityType, prefix) {
  await client.query(
    `insert into entity_counters (company_id, entity_type, next_value)
     values ($1, $2, 1)
     on conflict (company_id, entity_type) do nothing`,
    [companyId, entityType],
  );
  const { rows } = await client.query(
    `update entity_counters
     set next_value = next_value + 1, updated_at = now()
     where company_id = $1 and entity_type = $2
     returning next_value`,
    [companyId, entityType],
  );
  return formatNumber(prefix, Number(rows[0].next_value) - 1);
}

async function withTx(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

try {
  const companies = await pool.query("select id from company limit 2");
  assert(companies.rows.length === 1, "singleton company");
  const companyId = companies.rows[0].id;
  const tag = `m19-${Date.now()}`;
  const customerId = randomUUID();
  const quoteId = randomUUID();
  const lineId = randomUUID();

  const concurrent = await Promise.all(
    [0, 1, 2, 3, 4].map(() =>
      withTx((client) => allocate(client, companyId, "customer", "CUST-")),
    ),
  );
  assert(
    new Set(concurrent).size === concurrent.length,
    "concurrent customer numbers unique",
    concurrent.join(","),
  );

  const customerNumber = await withTx((client) =>
    allocate(client, companyId, "customer", "CUST-"),
  );
  assert(customerNumber.startsWith("CUST-"), "customer number format");

  const snapshot = {
    customerId,
    customerNumber,
    customerName: "M19 Original",
    companyName: "",
    phone: "2145550100",
    email: `${tag}@test.local`,
    street: "1 Test St",
    city: "Dallas",
    state: "TX",
    zip: "75201",
  };

  await pool.query(
    `insert into customers (
      id, company_id, customer_number, first_name, last_name, company_name,
      phone, email, street, city, state, zip, internal_notes, archived
    ) values ($1,$2,$3,'M19',$4,null,'2145550100',$5,'1 Test St','Dallas','TX','75201','verify',false)`,
    [customerId, companyId, customerNumber, tag, `${tag}@test.local`],
  );
  pass("customer create");

  const quoteNumber = await withTx(async (client) => {
    const number = await allocate(client, companyId, "quote", "QUO-");
    const today = new Date().toISOString().slice(0, 10);
    await client.query(
      `insert into quotes (
        id, company_id, quote_number, customer_id, customer_snapshot,
        job_description, status, quote_date, prepared_by,
        customer_message, terms_and_conditions,
        subtotal_cents, discount_type, discount_value, discount_cents,
        tax_rate, tax_cents, grand_total_cents, archived
      ) values ($1,$2,$3,$4,$5::jsonb,'M19 verify job','Draft',$6,'Verifier','hi','terms',
        10000,'none','0',0,'0',0,10000,false)`,
      [quoteId, companyId, number, customerId, JSON.stringify(snapshot), today],
    );
    await client.query(
      `insert into quote_line_items (
        id, company_id, quote_id, category, description, quantity, unit,
        unit_price_cents, line_total_cents, internal_notes, sort_order
      ) values ($1,$2,$3,'Services','Line A','1.5','hr',10000,15000,'',0)`,
      [lineId, companyId, quoteId],
    );
    return number;
  });
  assert(quoteNumber.startsWith("QUO-"), "quote number format");
  pass("quote+lines create transaction");

  const lines = await pool.query(
    `select quantity::text as q from quote_line_items where id = $1`,
    [lineId],
  );
  assert(Number(lines.rows[0].q) === 1.5, "decimal quantity preserved");

  await pool.query(
    `update customers set first_name = 'Changed', last_name = 'Name', updated_at = now() where id = $1`,
    [customerId],
  );
  const afterEdit = await pool.query(
    `select customer_snapshot from quotes where id = $1`,
    [quoteId],
  );
  assert(
    afterEdit.rows[0].customer_snapshot.customerName === "M19 Original",
    "customer snapshot not rewritten on customer edit",
  );

  const today = new Date().toISOString().slice(0, 10);
  const frozen = {
    frozenAt: today,
    company: {
      companyName: "Test Co",
      logo: null,
      phone: "1",
      email: "a@b.c",
      website: "",
      street: "s",
      city: "c",
      state: "TX",
      zip: "75201",
      currency: "USD",
      pdfFooterText: "",
    },
    quote: {
      quoteId: quoteNumber,
      quoteDate: today,
      validUntil: null,
      preparedBy: "Verifier",
      jobDescription: "M19 verify job",
      customerFacingMessage: "hi",
      termsAndConditions: "terms",
      customerSnapshot: snapshot,
      lineItems: [],
      subtotalCents: 10000,
      discountType: "none",
      discountValue: 0,
      discountAmountCents: 0,
      taxRate: 0,
      taxAmountCents: 0,
      grandTotalCents: 10000,
    },
  };

  await pool.query(
    `update quotes set status = 'Sent', sent_at = now(), pdf_snapshot = $2::jsonb, updated_at = now() where id = $1`,
    [quoteId, JSON.stringify(frozen)],
  );
  const sent = await pool.query(
    `select status, pdf_snapshot from quotes where id = $1`,
    [quoteId],
  );
  assert(sent.rows[0].status === "Sent", "mark sent");
  assert(
    sent.rows[0].pdf_snapshot?.quote?.quoteId === quoteNumber,
    "pdf snapshot durable",
  );

  await pool.query(
    `update quotes set status = 'Expired', expired_at = now(), valid_until = '2000-01-01', updated_at = now() where id = $1`,
    [quoteId],
  );
  const expired = await pool.query(
    `select status, pdf_snapshot is not null as has_pdf from quotes where id = $1`,
    [quoteId],
  );
  assert(expired.rows[0].status === "Expired", "expired");
  assert(expired.rows[0].has_pdf === true, "pdf snapshot kept on expire");

  await pool.query(
    `update customers set archived = true, archived_at = now(), updated_at = now() where id = $1`,
    [customerId],
  );
  const still = await pool.query(
    `select count(*)::int as n from quotes where id = $1`,
    [quoteId],
  );
  assert(still.rows[0].n === 1, "quote survives customer archive");

  await pool.query(`delete from quote_line_items where quote_id = $1`, [quoteId]);
  await pool.query(`delete from quotes where id = $1`, [quoteId]);
  await pool.query(`delete from customers where id = $1`, [customerId]);
  pass("cleanup test rows");
} catch (error) {
  fail("fatal", error instanceof Error ? error.message : error);
} finally {
  await pool.end();
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.filter((r) => r.ok).length}/${results.length} passed` +
    (failed.length ? ` — ${failed.length} failed` : ""),
);
process.exit(failed.length ? 1 : 0);
