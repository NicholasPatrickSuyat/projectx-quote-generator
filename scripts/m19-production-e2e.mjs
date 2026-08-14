/**
 * Local production-auth Customer/Quote E2E (NON-PRODUCTION Neon).
 * Never prints secrets. Uses Auth.js cookies + /api/dev/m19-auth-probe.
 *
 * Prerequisites:
 *   AUTH_MODE=production, PERSISTENCE_MODE=database, APP_ENV=development
 *   M19_AUTH_PROBE=1
 *   Server running on BASE_URL (default http://localhost:3000)
 *
 *   node scripts/m19-production-e2e.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const BASE = (process.env.M19_BASE_URL || process.env.M18_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  "",
);

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

function parseCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  if (raw.length) return raw.map((c) => c.split(";")[0]).join("; ");
  const single = res.headers.get("set-cookie");
  return single
    ? single
        .split(",")
        .map((c) => c.split(";")[0].trim())
        .join("; ")
    : "";
}

function mergeCookies(a, b) {
  const map = new Map();
  for (const part of `${a};${b}`.split(";")) {
    const p = part.trim();
    if (!p) continue;
    const i = p.indexOf("=");
    if (i <= 0) continue;
    map.set(p.slice(0, i), p.slice(i + 1));
  }
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function getCsrf(cookie = "") {
  const res = await fetch(`${BASE}/api/auth/csrf`, {
    headers: cookie ? { cookie } : {},
  });
  const data = await res.json();
  const nextCookie = mergeCookies(cookie, parseCookies(res));
  return { csrfToken: data.csrfToken, cookie: nextCookie };
}

async function signIn(email, password, cookie = "") {
  const { csrfToken, cookie: c1 } = await getCsrf(cookie);
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/`,
    json: "true",
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: c1,
    },
    body,
  });
  const c2 = mergeCookies(c1, parseCookies(res));
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { cookie: c2 },
  });
  const session = await sessionRes.json();
  return { res, cookie: c2, session, ok: Boolean(session?.user?.email) };
}

async function signOut(cookie) {
  const { csrfToken, cookie: c1 } = await getCsrf(cookie);
  await fetch(`${BASE}/api/auth/signout`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: c1,
    },
    body: new URLSearchParams({
      csrfToken,
      callbackUrl: `${BASE}/login`,
      json: "true",
    }),
  });
}

async function probeGet() {
  const res = await fetch(`${BASE}/api/dev/m19-auth-probe`);
  if (res.status === 404) {
    fail(
      "unauth probe enabled",
      "probe 404 — set M19_AUTH_PROBE=1 and restart server",
    );
    return null;
  }
  return res.json();
}

async function probePost(cookie, suite) {
  const res = await fetch(
    `${BASE}/api/dev/m19-auth-probe?suite=${encodeURIComponent(suite)}`,
    { method: "POST", headers: { cookie } },
  );
  if (res.status === 404) {
    fail(`probe ${suite}`, "POST probe 404");
    return null;
  }
  return res.json();
}

function mapResults(probe) {
  return Object.fromEntries(
    (probe?.results || []).map((r) => [r.label, r]),
  );
}

const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const staffEmail = process.env.M18_TEST_STAFF_EMAIL?.trim();
const staffPassword = process.env.M18_TEST_STAFF_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("Missing BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD");
  process.exit(1);
}
if (!staffEmail || !staffPassword) {
  console.error("Missing M18_TEST_STAFF_* in env");
  process.exit(1);
}
if ((process.env.AUTH_MODE || "").trim().toLowerCase() !== "production") {
  console.error("AUTH_MODE must be production for this E2E");
  process.exit(1);
}
if ((process.env.PERSISTENCE_MODE || "").trim().toLowerCase() !== "database") {
  console.error("PERSISTENCE_MODE must be database for this E2E");
  process.exit(1);
}
if ((process.env.APP_ENV || "").trim().toLowerCase() === "production") {
  console.error("Refusing APP_ENV=production");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL.trim());

{
  const existing = await sql`
    select id from app_users where lower(email) = ${staffEmail.toLowerCase()} limit 1
  `;
  if (existing.length === 0) {
    const company = await sql`select id from company order by created_at asc limit 1`;
    const hash = await bcrypt.hash(staffPassword, 12);
    await sql`
      insert into app_users (company_id, full_name, email, password_hash, role, active, auth_version)
      values (
        ${company[0].id},
        ${"M18 Test Staff"},
        ${staffEmail.toLowerCase()},
        ${hash},
        ${"Office Staff"},
        ${true},
        ${1}
      )
    `;
    pass("staff account created");
  } else {
    pass("staff account exists");
  }
}

// Unauthenticated denies
{
  const probe = await probeGet();
  if (probe) {
    for (const row of probe.results || []) {
      assert(
        row.result === "denied",
        `unauth ${row.label} denied`,
        row.message || row.result,
      );
    }
  }
}

// Admin full flow
{
  const login = await signIn(adminEmail, adminPassword);
  assert(login.ok, "admin login");
  const probe = await probePost(login.cookie, "adminFlow");
  if (probe) {
    const map = mapResults(probe);
    const expectAllowed = [
      "customerCreate",
      "customerEdit",
      "customerArchive",
      "customerRestore",
      "quoteCreateDraft",
      "quoteEdit",
      "quoteReorderRemoveLines",
      "quoteDuplicate",
      "quoteMarkSent",
      "quotePdfSnapshotServerOwned",
      "quoteAccept",
      "quoteReject",
      "quoteReturnToDraft",
      "quoteManualExpire",
      "quoteReactivate",
      "quoteArchive",
      "quoteRestore",
    ];
    for (const key of expectAllowed) {
      assert(
        map[key]?.result === "allowed",
        `admin ${key}`,
        map[key]?.message || map[key]?.result || "missing",
      );
    }
  }
  await signOut(login.cookie);
}

// Staff flow + denials
{
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login");
  assert(login.session?.user?.role === "Office Staff", "staff role");

  const caps = await probePost(login.cookie, "capabilities");
  if (caps) {
    const map = mapResults(caps);
    assert(map.customersReadAsUser?.result === "allowed", "staff customers read");
    assert(map.quotesReadAsUser?.result === "allowed", "staff quotes read");
    assert(map.customersRestoreAsUser?.result === "denied", "staff customer restore denied");
    assert(map.quotesRestoreAsUser?.result === "denied", "staff quote restore denied");
    assert(map.quotesExpireAsUser?.result === "denied", "staff expire denied");
    assert(map.quotesReactivateAsUser?.result === "denied", "staff reactivate denied");
  }

  const flow = await probePost(login.cookie, "staffFlow");
  if (flow) {
    const map = mapResults(flow);
    for (const key of [
      "customerCreate",
      "customerEdit",
      "customerArchive",
      "quoteCreateDraft",
      "quoteEdit",
      "quoteDuplicate",
      "quoteMarkSent",
      "quoteAccept",
      "quoteReject",
      "quoteArchive",
    ]) {
      assert(
        map[key]?.result === "allowed",
        `staff ${key}`,
        map[key]?.message || map[key]?.result || "missing",
      );
    }
    assert(map.customerRestore?.result === "denied", "staff customer restore in flow denied");
    assert(map.quoteRestore?.result === "denied", "staff quote restore in flow denied");
    assert(map.quoteManualExpire?.result === "denied", "staff manual expire denied");
    assert(map.quoteReactivate?.result === "denied", "staff reactivate denied");
  }
  await signOut(login.cookie);
}

// Forged inputs (admin session — capability to create base fixtures)
{
  const login = await signIn(adminEmail, adminPassword);
  assert(login.ok, "admin login for forged suite");
  const probe = await probePost(login.cookie, "forged");
  if (probe) {
    const map = mapResults(probe);
    assert(map.forgeCreateSent?.result === "denied", "forge create Sent denied");
    assert(
      map.forgeCreatePdfSnapshot?.result === "denied",
      "forge create pdfSnapshot denied",
    );
    assert(
      map.forgeUpdateToAccepted?.result === "denied",
      "forge update Accepted denied/ignored",
    );
    assert(
      map.forgeUpdateSentAt?.result === "denied",
      "forge update sentAt denied/ignored",
    );
    assert(
      map.forgeForeignLineUuid?.result === "denied",
      "foreign line UUID denied",
      map.forgeForeignLineUuid?.message,
    );
    assert(
      map.forgeForeignCustomer?.result === "denied",
      "foreign customer denied",
      map.forgeForeignCustomer?.message,
    );
    assert(
      map.customerEditKeepsQuoteSnapshot?.result === "allowed",
      "customer edit keeps historical snapshot",
    );
    assert(
      map.draftCustomerSwitchRebuildsSnapshot?.result === "allowed",
      "draft customer switch rebuilds snapshot",
    );
    // Admin may override prepared by
    const prep = map.forgePreparedByCreate;
    assert(prep?.result === "allowed", "admin preparedBy override allowed", prep?.message);
    if (prep?.value?.preparedBy) {
      assert(
        prep.value.preparedBy === "Totally Different Employee",
        "admin preparedBy override honored",
        String(prep.value.preparedBy),
      );
      assert(
        prep.value.preparedByUserId === prep.value.actorId ||
          prep.value.preparedByUserId === login.session?.user?.id,
        "admin preparedByUserId stays actor",
        String(prep.value.preparedByUserId),
      );
    }
  }
  await signOut(login.cookie);
}

// Staff prepared-by spoof denied/normalized
{
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login for preparedBy spoof");
  const probe = await probePost(login.cookie, "forged");
  if (probe) {
    const prep = mapResults(probe).forgePreparedByCreate;
    assert(prep?.result === "allowed", "staff create with spoofed preparedBy runs");
    if (prep?.value) {
      assert(
        prep.value.preparedBy !== "Totally Different Employee",
        "staff preparedBy spoof normalized",
        String(prep.value.preparedBy),
      );
      assert(
        prep.value.preparedByUserId === prep.value.actorId ||
          prep.value.preparedByUserId === login.session?.user?.id,
        "staff preparedByUserId forced to actor",
        String(prep.value.preparedByUserId),
      );
    }
  }
  await signOut(login.cookie);
}

// PDF freeze retained after accept (SQL)
{
  const rows = await sql`
    select status, pdf_snapshot is not null as has_pdf
    from quotes
    where status in ('Accepted', 'Rejected', 'Expired')
      and pdf_snapshot is not null
    limit 5
  `;
  assert(rows.length >= 1, "frozen pdf retained on terminal statuses");
}

// Number uniqueness smoke
{
  const dupQ = await sql`
    select quote_number, count(*)::int as c
    from quotes
    group by company_id, quote_number
    having count(*) > 1
  `;
  const dupC = await sql`
    select customer_number, count(*)::int as c
    from customers
    group by company_id, customer_number
    having count(*) > 1
  `;
  assert(dupQ.length === 0, "no duplicate quote numbers");
  assert(dupC.length === 0, "no duplicate customer numbers");
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.filter((r) => r.ok).length}/${results.length} passed` +
    (failed.length ? ` — ${failed.length} failed` : ""),
);
if (failed.length) {
  for (const f of failed) console.error("-", f.name, f.err);
  process.exit(1);
}
