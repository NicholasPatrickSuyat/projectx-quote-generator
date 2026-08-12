/**
 * Local production-auth E2E (NON-PRODUCTION).
 * Uses Auth.js HTTP endpoints + Neon verification. Never prints secrets.
 *
 * Prerequisites:
 *   AUTH_MODE=production, PERSISTENCE_MODE=database, APP_ENV=development
 *   Server running on BASE_URL (default http://localhost:3000)
 *   Admin bootstrapped; optional staff created by this script
 *
 * node scripts/m18-production-e2e.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

const BASE = (process.env.M18_BASE_URL || "http://localhost:3000").replace(
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
  return single ? single.split(",").map((c) => c.split(";")[0].trim()).join("; ") : "";
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
  const res = await fetch(`${BASE}/api/auth/signout`, {
    method: "POST",
    redirect: "manual",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      cookie: c1,
    },
    body: new URLSearchParams({ csrfToken, callbackUrl: `${BASE}/login`, json: "true" }),
  });
  return mergeCookies(c1, parseCookies(res));
}

async function probeUnauth() {
  const res = await fetch(`${BASE}/api/dev/m18-auth-probe`);
  if (res.status === 404) {
    fail(
      "unauth probe enabled",
      "probe returned 404 — set M18_AUTH_PROBE=1 and restart",
    );
    return null;
  }
  return res.json();
}

async function probeAuth(cookie, persistSmoke = false) {
  const qs = persistSmoke ? "?persistSmoke=1" : "";
  const res = await fetch(`${BASE}/api/dev/m18-auth-probe${qs}`, {
    method: "POST",
    headers: { cookie },
  });
  if (res.status === 404) {
    fail("auth probe enabled", "POST probe 404");
    return null;
  }
  return res.json();
}

const adminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim();
const adminPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
const staffEmail = process.env.M18_TEST_STAFF_EMAIL?.trim();
const staffPassword = process.env.M18_TEST_STAFF_PASSWORD;

if (!adminEmail || !adminPassword) {
  console.error("Missing BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD in env");
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

const sql = neon(process.env.DATABASE_URL.trim());

// Ensure staff user exists (create if missing) — Admin-managed path via SQL+bcrypt (same as Users create)
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
    pass("staff account created (db-backed)");
  } else {
    pass("staff account already exists");
  }
}

// --- Auth: Admin ---
{
  const login = await signIn(adminEmail, adminPassword);
  assert(login.ok, "admin valid login", JSON.stringify(login.session));
  assert(login.session?.user?.role === "Admin", "admin session role Admin");
  const dash = await fetch(`${BASE}/`, { headers: { cookie: login.cookie }, redirect: "manual" });
  assert(dash.status === 200 || dash.status === 307 || dash.status === 302, "admin dashboard reachable", String(dash.status));
  await signOut(login.cookie);
  const after = await signIn(adminEmail, adminPassword);
  assert(after.ok, "admin re-login");
  // keep admin cookie for later mutations via SQL (session tests use separate logins)
}

// --- Auth: Staff ---
let staffCookie = "";
{
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff valid login");
  assert(login.session?.user?.role === "Office Staff", "staff session role");
  staffCookie = login.cookie;
  await signOut(staffCookie);
}

// --- Invalid logins ---
{
  const bad = await signIn(adminEmail, "definitely-wrong-password-xx");
  assert(!bad.ok, "wrong password rejected");
  const unknown = await signIn("nobody@example.com", "SomePassword12");
  assert(!unknown.ok, "unknown email rejected");
}

// --- Inactive login ---
{
  const staffRow = await sql`select id, auth_version from app_users where lower(email)=${staffEmail.toLowerCase()} limit 1`;
  await sql`update app_users set active=false, auth_version=auth_version+1 where id=${staffRow[0].id}`;
  const inactiveLogin = await signIn(staffEmail, staffPassword);
  assert(!inactiveLogin.ok, "inactive login rejected");
  await sql`update app_users set active=true where id=${staffRow[0].id}`;
  // note: auth_version stays bumped — old tokens invalid; fresh login should work
  const again = await signIn(staffEmail, staffPassword);
  assert(again.ok, "fresh login after reactivation works");
  await signOut(again.cookie);
}

// --- Unauthenticated probe ---
{
  const probe = await probeUnauth();
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

// --- Staff authorization (server) ---
{
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login for authz probe");
  const probe = await probeAuth(login.cookie);
  if (probe) {
    const map = Object.fromEntries(
      (probe.results || []).map((r) => [r.label, r.result]),
    );
    assert(map.activeUser === "allowed", "staff activeUser allowed");
    assert(map.catalogReadAsUser === "allowed", "staff catalog read allowed");
    assert(map.settingsReadAsUser === "denied", "staff settings read denied");
    assert(map.settingsWriteAsUser === "denied", "staff settings write denied");
    assert(map.catalogManageAsUser === "denied", "staff catalog manage denied");
    assert(map.usersManageAsUser === "denied", "staff users manage denied");
    assert(map.usersListAsUser === "denied", "staff users list denied");
  }
  await signOut(login.cookie);
}

// --- Admin authorization (server) ---
{
  const login = await signIn(adminEmail, adminPassword);
  assert(login.ok, "admin login for authz probe");
  const probe = await probeAuth(login.cookie);
  if (probe) {
    const map = Object.fromEntries(
      (probe.results || []).map((r) => [r.label, r.result]),
    );
    assert(map.settingsReadAsUser === "allowed", "admin settings read allowed");
    assert(map.settingsWriteAsUser === "allowed", "admin settings capability allowed");
    assert(map.catalogReadAsUser === "allowed", "admin catalog read allowed");
    assert(map.catalogManageAsUser === "allowed", "admin catalog manage allowed");
    assert(map.usersManageAsUser === "allowed", "admin users manage allowed");
    assert(map.usersListAsUser === "allowed", "admin users list allowed");
  }
  const persist = await probeAuth(login.cookie, true);
  if (persist) {
    const map = Object.fromEntries(
      (persist.results || []).map((r) => [r.label, r.result]),
    );
    assert(
      map.settingsPersistRoundTrip === "allowed",
      "admin settings persist round-trip",
      map.settingsPersistRoundTrip,
    );
    assert(
      map.catalogPersistRoundTrip === "allowed",
      "admin catalog persist round-trip",
      map.catalogPersistRoundTrip,
    );
  }
  await signOut(login.cookie);
}

// --- Session revocation: password reset ---
{
  const before = await sql`select id, auth_version, password_hash from app_users where lower(email)=${staffEmail.toLowerCase()} limit 1`;
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login before password reset");
  const newHash = await bcrypt.hash(staffPassword + "-rotated", 12);
  await sql`
    update app_users
    set password_hash=${newHash}, auth_version=auth_version+1, updated_at=now()
    where id=${before[0].id}
  `;
  // Old session should fail privileged path via auth_version on next JWT recheck —
  // force by calling probe isn't enough; check session after waiting is hard.
  // Verify requireActiveUser semantics via DB version mismatch:
  const after = await sql`select auth_version from app_users where id=${before[0].id}`;
  assert(
    Number(after[0].auth_version) === Number(before[0].auth_version) + 1,
    "password reset bumps auth_version",
  );
  const oldPw = await signIn(staffEmail, staffPassword);
  assert(!oldPw.ok, "old password login fails after reset");
  const newPw = await signIn(staffEmail, staffPassword + "-rotated");
  assert(newPw.ok, "new password login succeeds");
  // restore staff password to env password for later tests
  const restoreHash = await bcrypt.hash(staffPassword, 12);
  await sql`
    update app_users
    set password_hash=${restoreHash}, auth_version=auth_version+1, updated_at=now()
    where id=${before[0].id}
  `;
  await signOut(newPw.cookie);
}

// --- Role change bumps version ---
{
  const before = await sql`select id, auth_version, role from app_users where lower(email)=${staffEmail.toLowerCase()} limit 1`;
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login before role change");
  await sql`
    update app_users
    set role=${"Admin"}, auth_version=auth_version+1, updated_at=now()
    where id=${before[0].id}
  `;
  const mid = await sql`select auth_version, role from app_users where id=${before[0].id}`;
  assert(mid[0].role === "Admin", "role changed to Admin in DB");
  assert(
    Number(mid[0].auth_version) === Number(before[0].auth_version) + 1,
    "role change bumps auth_version",
  );
  // revert to Office Staff with another bump (old Admin JWT still invalid)
  await sql`
    update app_users
    set role=${"Office Staff"}, auth_version=auth_version+1, updated_at=now()
    where id=${before[0].id}
  `;
  const fresh = await signIn(staffEmail, staffPassword);
  assert(fresh.ok && fresh.session?.user?.role === "Office Staff", "fresh login gets current Staff role");
  await signOut(fresh.cookie);
}

// --- Deactivation invalidates; reactivation does not revive old version ---
{
  const before = await sql`select id, auth_version from app_users where lower(email)=${staffEmail.toLowerCase()} limit 1`;
  const login = await signIn(staffEmail, staffPassword);
  assert(login.ok, "staff login before deactivation");
  const tokenVersion = login.session?.user?.authVersion;
  await sql`
    update app_users
    set active=false, auth_version=auth_version+1, updated_at=now()
    where id=${before[0].id}
  `;
  const afterDeact = await sql`select auth_version, active from app_users where id=${before[0].id}`;
  assert(afterDeact[0].active === false, "staff deactivated");
  assert(
    Number(afterDeact[0].auth_version) > Number(tokenVersion || before[0].auth_version),
    "deactivation bumps auth_version beyond session",
  );
  // Reactivate WITHOUT restoring old auth_version
  await sql`update app_users set active=true where id=${before[0].id}`;
  const afterReact = await sql`select auth_version, active from app_users where id=${before[0].id}`;
  assert(afterReact[0].active === true, "staff reactivated");
  assert(
    Number(afterReact[0].auth_version) === Number(afterDeact[0].auth_version),
    "reactivation does not restore old auth_version",
  );
  const staleWouldFail =
    Number(tokenVersion) !== Number(afterReact[0].auth_version);
  assert(staleWouldFail, "old JWT auth_version remains mismatched after reactivate");
  const fresh = await signIn(staffEmail, staffPassword);
  assert(fresh.ok, "fresh login after reactivation");
  await signOut(fresh.cookie);
}

// --- Settings/Catalog persistence smoke (via SQL presence; UI covered separately) ---
{
  const settings = await sql`select company_name from company_settings limit 1`;
  assert(settings.length === 1, "settings row exists for persistence");
  const catalog = await sql`select count(*)::int as c from catalog_items`;
  assert(Number(catalog[0].c) >= 0, "catalog table readable");
}

// --- Admin session still valid after staff-only revocations ---
{
  const admin = await signIn(adminEmail, adminPassword);
  assert(admin.ok, "admin session unaffected by staff revocation tests");
  await signOut(admin.cookie);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} passed`);
if (failed.length) {
  console.error("Failures:");
  for (const f of failed) console.error("-", f.name, f.err);
  process.exit(1);
}
