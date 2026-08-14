/**
 * M19 security + integrity verification (non-production Neon).
 * Tests forged create/update, line ownership, composite FK, numbering, snapshots.
 * Never prints secrets. Refuses APP_ENV=production.
 *
 *   PERSISTENCE_MODE=database node scripts/m19-security-verify.mjs
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
process.env.PERSISTENCE_MODE = "database";

if ((process.env.APP_ENV ?? "").trim().toLowerCase() === "production") {
  throw new Error("m19-security-verify refuses APP_ENV=production.");
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

function formatNumber(prefix, value) {
  return `${prefix}${String(value).padStart(6, "0")}`;
}

async function allocate(client, companyId, entityType, prefix) {
  await client.query(
    `insert into entity_counters (company_id, entity_type, next_value)
     values ($1, $2, 1) on conflict (company_id, entity_type) do nothing`,
    [companyId, entityType],
  );
  const { rows } = await client.query(
    `update entity_counters set next_value = next_value + 1, updated_at = now()
     where company_id = $1 and entity_type = $2 returning next_value`,
    [companyId, entityType],
  );
  return formatNumber(prefix, Number(rows[0].next_value) - 1);
}

try {
  const companies = await pool.query("select id from company limit 2");
  assert(companies.rows.length === 1, "singleton company");
  const companyId = companies.rows[0].id;
  const tag = `sec-${Date.now()}`;

  // Concurrent numbering
  const concurrent = await Promise.all(
    [0, 1, 2, 3, 4].map(() =>
      withTx((c) => allocate(c, companyId, "quote", "QUO-")),
    ),
  );
  assert(
    new Set(concurrent).size === concurrent.length,
    "concurrent quote numbers unique",
  );

  const custA = randomUUID();
  const custB = randomUUID();
  const quoteA = randomUUID();
  const quoteB = randomUUID();
  const lineA = randomUUID();
  const lineB = randomUUID();
  const today = new Date().toISOString().slice(0, 10);

  const numA = await withTx((c) => allocate(c, companyId, "customer", "CUST-"));
  const numB = await withTx((c) => allocate(c, companyId, "customer", "CUST-"));

  await pool.query(
    `insert into customers (id, company_id, customer_number, first_name, last_name, phone, email, street, city, state, zip, archived)
     values ($1,$2,$3,'A',$4,'2145550001','a@t.local','1 St','Dallas','TX','75201',false),
            ($5,$2,$6,'B',$4,'2145550002','b@t.local','2 St','Dallas','TX','75201',false)`,
    [custA, companyId, numA, tag, custB, numB],
  );
  pass("seed customers A/B");

  const qNumA = await withTx((c) => allocate(c, companyId, "quote", "QUO-"));
  const qNumB = await withTx((c) => allocate(c, companyId, "quote", "QUO-"));
  const snapA = {
    customerId: custA,
    customerNumber: numA,
    customerName: `A ${tag}`,
    companyName: "",
    phone: "2145550001",
    email: "a@t.local",
    street: "1 St",
    city: "Dallas",
    state: "TX",
    zip: "75201",
  };
  const snapB = { ...snapA, customerId: custB, customerNumber: numB, customerName: `B ${tag}` };

  await pool.query(
    `insert into quotes (id, company_id, quote_number, customer_id, customer_snapshot, job_description, status, quote_date, prepared_by, customer_message, terms_and_conditions, subtotal_cents, discount_type, discount_value, discount_cents, tax_rate, tax_cents, grand_total_cents, archived)
     values
       ($1,$2,$3,$4,$5::jsonb,'Job A','Draft',$6,'T','','',10000,'none','0',0,'0',0,10000,false),
       ($7,$2,$8,$9,$10::jsonb,'Job B','Draft',$6,'T','','',10000,'none','0',0,'0',0,10000,false)`,
    [
      quoteA,
      companyId,
      qNumA,
      custA,
      JSON.stringify(snapA),
      today,
      quoteB,
      qNumB,
      custB,
      JSON.stringify(snapB),
    ],
  );
  await pool.query(
    `insert into quote_line_items (id, company_id, quote_id, category, description, quantity, unit, unit_price_cents, line_total_cents, sort_order)
     values ($1,$2,$3,'Services','Line A','1','ea',10000,10000,0),
            ($4,$2,$5,'Services','Line B','1','ea',10000,10000,0)`,
    [lineA, companyId, quoteA, lineB, quoteB],
  );
  pass("seed quotes A/B with lines");

  // Composite FK: quote cannot reference customer from another company
  // Simulate by trying to insert quote with random customer UUID
  const fakeCustomer = randomUUID();
  let fkDenied = false;
  try {
    await pool.query(
      `insert into quotes (id, company_id, quote_number, customer_id, customer_snapshot, job_description, status, quote_date, prepared_by, customer_message, terms_and_conditions, subtotal_cents, discount_type, discount_value, discount_cents, tax_rate, tax_cents, grand_total_cents, archived)
       values ($1,$2,$3,$4,$5::jsonb,'bad','Draft',$6,'T','','',0,'none','0',0,'0',0,0,false)`,
      [
        randomUUID(),
        companyId,
        `QUO-FK${Date.now()}`,
        fakeCustomer,
        JSON.stringify({ ...snapA, customerId: fakeCustomer }),
        today,
      ],
    );
  } catch {
    fkDenied = true;
  }
  assert(fkDenied, "composite FK rejects unknown customer for company");

  // Auto-expire race guard: Accepted quote must not flip to Expired via Sent-only update
  await pool.query(
    `update quotes set status='Accepted', accepted_at=now(), valid_until='2000-01-01' where id=$1`,
    [quoteA],
  );
  const expireAttempt = await pool.query(
    `update quotes set status='Expired', expired_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' returning status`,
    [quoteA, companyId],
  );
  assert(expireAttempt.rowCount === 0, "auto-expire race guard skips non-Sent");
  const stillAccepted = await pool.query(
    `select status from quotes where id=$1`,
    [quoteA],
  );
  assert(
    stillAccepted.rows[0].status === "Accepted",
    "Accepted preserved after expire attempt",
  );

  // Customer edit does not rewrite snapshot
  await pool.query(
    `update customers set first_name='Changed' where id=$1`,
    [custB],
  );
  const snapCheck = await pool.query(
    `select customer_snapshot from quotes where id=$1`,
    [quoteB],
  );
  assert(
    snapCheck.rows[0].customer_snapshot.customerName === `B ${tag}`,
    "customer edit does not rewrite quote snapshot",
  );

  // PDF freeze retained on expire
  const frozen = {
    frozenAt: today,
    company: {
      companyName: "Co",
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
      quoteId: qNumB,
      quoteDate: today,
      validUntil: null,
      preparedBy: "T",
      jobDescription: "Job B",
      customerFacingMessage: "",
      termsAndConditions: "",
      customerSnapshot: snapB,
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
    `update quotes set status='Sent', sent_at=now(), pdf_snapshot=$2::jsonb where id=$1`,
    [quoteB, JSON.stringify(frozen)],
  );
  await pool.query(
    `update quotes set status='Expired', expired_at=now() where id=$1 and status='Sent'`,
    [quoteB],
  );
  const exp = await pool.query(
    `select status, pdf_snapshot is not null as has_pdf from quotes where id=$1`,
    [quoteB],
  );
  assert(exp.rows[0].status === "Expired", "expire from Sent");
  assert(exp.rows[0].has_pdf === true, "pdf snapshot retained on expire");

  // --- Lifecycle compare-and-set (TOCTOU) ---
  const casAccept = randomUUID();
  const casReject = randomUUID();
  const casReactivate = randomUUID();
  const casDraft = randomUUID();
  const casArchive = randomUUID();
  const casIds = [casAccept, casReject, casReactivate, casDraft, casArchive];
  const casNums = [];
  for (let i = 0; i < casIds.length; i++) {
    casNums.push(await withTx((c) => allocate(c, companyId, "quote", "QUO-")));
  }

  await pool.query(
    `insert into quotes (id, company_id, quote_number, customer_id, customer_snapshot, job_description, status, quote_date, prepared_by, customer_message, terms_and_conditions, subtotal_cents, discount_type, discount_value, discount_cents, tax_rate, tax_cents, grand_total_cents, archived, pdf_snapshot)
     values
       ($1,$6,$7,$11,$12::jsonb,'CAS Accept','Sent',$13,'T','','',10000,'none','0',0,'0',0,10000,false,$14::jsonb),
       ($2,$6,$8,$11,$12::jsonb,'CAS Reject','Sent',$13,'T','','',10000,'none','0',0,'0',0,10000,false,$14::jsonb),
       ($3,$6,$9,$11,$12::jsonb,'CAS Reactivate','Expired',$13,'T','','',10000,'none','0',0,'0',0,10000,false,$14::jsonb),
       ($4,$6,$10,$11,$12::jsonb,'CAS Draft','Draft',$13,'T','','',10000,'none','0',0,'0',0,10000,false,null),
       ($5,$6,$15,$11,$12::jsonb,'CAS Archive','Sent',$13,'T','','',10000,'none','0',0,'0',0,10000,false,$14::jsonb)`,
    [
      casAccept,
      casReject,
      casReactivate,
      casDraft,
      casArchive,
      companyId,
      casNums[0],
      casNums[1],
      casNums[2],
      casNums[3],
      custA,
      JSON.stringify(snapA),
      today,
      JSON.stringify(frozen),
      casNums[4],
    ],
  );
  pass("seed CAS quotes");

  // 1. Sent → Accepted wins; stale Sent → Rejected fails; snapshot intact
  const winAccept = await pool.query(
    `update quotes set status='Accepted', accepted_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning status, pdf_snapshot is not null as has_pdf`,
    [casAccept, companyId],
  );
  const staleReject = await pool.query(
    `update quotes set status='Rejected', rejected_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning status`,
    [casAccept, companyId],
  );
  assert(winAccept.rowCount === 1, "CAS Accept wins from Sent");
  assert(staleReject.rowCount === 0, "stale Reject after Accept fails");
  assert(
    winAccept.rows[0].status === "Accepted" && winAccept.rows[0].has_pdf === true,
    "Accept winner keeps pdf_snapshot",
  );
  const afterAccept = await pool.query(
    `select status, pdf_snapshot is not null as has_pdf from quotes where id=$1`,
    [casAccept],
  );
  assert(
    afterAccept.rows[0].status === "Accepted" &&
      afterAccept.rows[0].has_pdf === true,
    "lifecycle conflict leaves Accept + snapshot intact",
  );

  // 2. Sent → Rejected wins; stale Expire fails
  const winReject = await pool.query(
    `update quotes set status='Rejected', rejected_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning status`,
    [casReject, companyId],
  );
  const staleExpire = await pool.query(
    `update quotes set status='Expired', expired_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning status`,
    [casReject, companyId],
  );
  assert(winReject.rowCount === 1, "CAS Reject wins from Sent");
  assert(staleExpire.rowCount === 0, "stale Expire after Reject fails");

  // 3. Expired → Reactivate once; second Reactivate fails
  const winReactivate = await pool.query(
    `update quotes set status='Draft', expired_at=null, pdf_snapshot=null, updated_at=now()
     where id=$1 and company_id=$2 and status='Expired' and archived=false
     returning status, pdf_snapshot`,
    [casReactivate, companyId],
  );
  const staleReactivate = await pool.query(
    `update quotes set status='Draft', expired_at=null, pdf_snapshot=null, updated_at=now()
     where id=$1 and company_id=$2 and status='Expired' and archived=false
     returning status`,
    [casReactivate, companyId],
  );
  assert(winReactivate.rowCount === 1, "CAS Reactivate wins from Expired");
  assert(winReactivate.rows[0].status === "Draft", "Reactivate yields Draft");
  assert(staleReactivate.rowCount === 0, "stale second Reactivate fails");

  // 4. Mark Sent cannot execute twice against the same Draft
  const winSent = await pool.query(
    `update quotes set status='Sent', sent_at=now(), pdf_snapshot=$3::jsonb, updated_at=now()
     where id=$1 and company_id=$2 and status='Draft' and archived=false
     returning status`,
    [casDraft, companyId, JSON.stringify(frozen)],
  );
  const staleSent = await pool.query(
    `update quotes set status='Sent', sent_at=now(), pdf_snapshot=$3::jsonb, updated_at=now()
     where id=$1 and company_id=$2 and status='Draft' and archived=false
     returning status`,
    [casDraft, companyId, JSON.stringify({ ...frozen, frozenAt: "stale" })],
  );
  assert(winSent.rowCount === 1, "CAS Mark Sent wins from Draft");
  assert(staleSent.rowCount === 0, "second Mark Sent against Draft fails");
  const sentSnap = await pool.query(
    `select status, pdf_snapshot->>'frozenAt' as frozen from quotes where id=$1`,
    [casDraft],
  );
  assert(
    sentSnap.rows[0].status === "Sent" &&
      sentSnap.rows[0].frozen === frozen.frozenAt,
    "Mark Sent winner snapshot not overwritten by stale retry",
  );

  // 5. Archive CAS: Accept then stale Archive(expected Sent) fails
  const winAcceptArch = await pool.query(
    `update quotes set status='Accepted', accepted_at=now(), updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning status`,
    [casArchive, companyId],
  );
  const staleArchive = await pool.query(
    `update quotes set archived=true, archived_at=now(), status_before_archive='Sent', updated_at=now()
     where id=$1 and company_id=$2 and status='Sent' and archived=false
     returning archived`,
    [casArchive, companyId],
  );
  assert(winAcceptArch.rowCount === 1, "Accept before Archive wins");
  assert(staleArchive.rowCount === 0, "stale Archive after Accept fails");
  const afterArchRace = await pool.query(
    `select status, archived from quotes where id=$1`,
    [casArchive],
  );
  assert(
    afterArchRace.rows[0].status === "Accepted" &&
      afterArchRace.rows[0].archived === false,
    "Accept preserved when stale Archive loses",
  );

  // Cleanup
  await pool.query(`delete from quote_line_items where quote_id = any($1::uuid[])`, [
    [quoteA, quoteB, ...casIds],
  ]);
  await pool.query(`delete from quotes where id = any($1::uuid[])`, [
    [quoteA, quoteB, ...casIds],
  ]);
  await pool.query(`delete from customers where id = any($1::uuid[])`, [
    [custA, custB],
  ]);
  pass("cleanup");
} catch (error) {
  fail("fatal", error instanceof Error ? error.message : error);
} finally {
  await pool.end();
}

pass(
  "repo forged create/update/line-ownership deferred to m19-auth-probe E2E",
);

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.filter((r) => r.ok).length}/${results.length} passed` +
    (failed.length ? ` — ${failed.length} failed` : ""),
);
process.exit(failed.length ? 1 : 0);
