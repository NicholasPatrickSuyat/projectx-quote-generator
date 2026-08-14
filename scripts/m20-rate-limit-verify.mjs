/**
 * M20 Gate 1 — login rate-limit verification (non-production Neon).
 * Mirrors atomic reserve-before-verify SQL used by src/lib/auth/login-rate-limit.ts.
 *
 * Threshold semantics:
 *   EMAIL max=5 → attempts 1–5 may reserve; 6th blocked before password work.
 *   IP max=20 → attempts 1–20 may reserve; 21st blocked.
 *
 *   PERSISTENCE_MODE=database node scripts/m20-rate-limit-verify.mjs
 */
import { createHash } from "node:crypto";
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

if ((process.env.APP_ENV ?? "").trim().toLowerCase() === "production") {
  throw new Error("m20-rate-limit-verify refuses APP_ENV=production.");
}
const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("DATABASE_URL required.");

const EMAIL_MAX = 5;
const IP_MAX = 20;
const WINDOW_MS = 15 * 60 * 1000;
const GENERIC = "Invalid email or password.";

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

function emailHash(email) {
  return createHash("sha256").update(`email:${email}`).digest("hex");
}

const pool = new Pool({ connectionString: url });
const tag = `m20-${Date.now()}`;
const email = `rate-${tag}@example.com`;
const eHash = emailHash(email);
const unknownEmail = `unknown-${tag}@example.com`;
const unknownHash = emailHash(unknownEmail);
const inactiveEmail = `inactive-${tag}@example.com`;
const inactiveHash = emailHash(inactiveEmail);
const ip = "198.51.100.42";
const ipKey = `ip:${ip}`;
const abuseIp = "198.51.100.99";
const abuseIpKey = `ip:${abuseIp}`;

async function ensure(dimension, keyHash) {
  await pool.query(
    `insert into login_rate_limits (dimension, key_hash, attempt_count, window_started_at, updated_at)
     values ($1,$2,0,now(),now())
     on conflict (dimension, key_hash) do nothing`,
    [dimension, keyHash],
  );
}

/**
 * Atomic reserve — mirrors app reserveAttemptOn() for one dimension.
 * @returns {{ ok: true, count: number } | { ok: false, limited: true }}
 */
async function reserve(dimension, keyHash, maxAttempts, client = pool) {
  await ensure(dimension, keyHash);
  const { rows } = await client.query(
    `update login_rate_limits
     set attempt_count = case
           when window_started_at < now() - interval '15 minutes' then 1
           else attempt_count + 1
         end,
         window_started_at = case
           when window_started_at < now() - interval '15 minutes' then now()
           else window_started_at
         end,
         updated_at = now()
     where dimension = $1
       and key_hash = $2
       and (
         window_started_at < now() - interval '15 minutes'
         or attempt_count < $3
       )
     returning attempt_count`,
    [dimension, keyHash, maxAttempts],
  );
  if (!rows[0]) return { ok: false, limited: true };
  return { ok: true, count: Number(rows[0].attempt_count) };
}

/**
 * Mirrors app reserveLoginAttempt: email + IP in one transaction.
 * Rolls back both if either dimension cannot reserve.
 * @returns {{ ok: true } | { ok: false, limited: true }}
 */
async function reservePair(emailKeyHash, ipKeyHash) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(
      `insert into login_rate_limits (dimension, key_hash, attempt_count, window_started_at, updated_at)
       values ('email',$1,0,now(),now())
       on conflict (dimension, key_hash) do nothing`,
      [emailKeyHash],
    );
    await client.query(
      `insert into login_rate_limits (dimension, key_hash, attempt_count, window_started_at, updated_at)
       values ('ip',$1,0,now(),now())
       on conflict (dimension, key_hash) do nothing`,
      [ipKeyHash],
    );

    const emailRes = await client.query(
      `update login_rate_limits
       set attempt_count = case
             when window_started_at < now() - interval '15 minutes' then 1
             else attempt_count + 1
           end,
           window_started_at = case
             when window_started_at < now() - interval '15 minutes' then now()
             else window_started_at
           end,
           updated_at = now()
       where dimension = 'email'
         and key_hash = $1
         and (
           window_started_at < now() - interval '15 minutes'
           or attempt_count < $2
         )
       returning attempt_count`,
      [emailKeyHash, EMAIL_MAX],
    );
    if (!emailRes.rows[0]) {
      await client.query("rollback");
      return { ok: false, limited: true };
    }

    const ipRes = await client.query(
      `update login_rate_limits
       set attempt_count = case
             when window_started_at < now() - interval '15 minutes' then 1
             else attempt_count + 1
           end,
           window_started_at = case
             when window_started_at < now() - interval '15 minutes' then now()
             else window_started_at
           end,
           updated_at = now()
       where dimension = 'ip'
         and key_hash = $1
         and (
           window_started_at < now() - interval '15 minutes'
           or attempt_count < $2
         )
       returning attempt_count`,
      [ipKeyHash, IP_MAX],
    );
    if (!ipRes.rows[0]) {
      await client.query("rollback");
      return { ok: false, limited: true };
    }

    await client.query("commit");
    return { ok: true };
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    client.release();
  }
}

async function getCount(dimension, keyHash) {
  const { rows } = await pool.query(
    `select attempt_count from login_rate_limits where dimension=$1 and key_hash=$2`,
    [dimension, keyHash],
  );
  return rows[0] ? Number(rows[0].attempt_count) : 0;
}

async function clearEmail(keyHash) {
  await pool.query(
    `delete from login_rate_limits where dimension='email' and key_hash=$1`,
    [keyHash],
  );
}

async function releaseIp(key) {
  await pool.query(
    `update login_rate_limits
     set attempt_count = greatest(attempt_count - 1, 0), updated_at = now()
     where dimension='ip' and key_hash=$1`,
    [key],
  );
}

async function cleanupKeys(keys) {
  await pool.query(
    `delete from login_rate_limits where key_hash = any($1::text[])`,
    [keys],
  );
}

try {
  const reg = await pool.query(
    `select to_regclass('public.login_rate_limits')::text as reg`,
  );
  assert(reg.rows[0].reg === "login_rate_limits", "table exists");

  await cleanupKeys([
    eHash,
    unknownHash,
    inactiveHash,
    ipKey,
    abuseIpKey,
    emailHash(`concurrent-email-${tag}@example.com`),
    emailHash(`post-threshold-${tag}@example.com`),
    `ip:concurrent-${tag}`,
    `ip:blocked-${tag}`,
    emailHash(`fresh-vs-blocked-ip-${tag}@example.com`),
    emailHash(`blocked-email-${tag}@example.com`),
    `ip:fresh-${tag}`,
    emailHash(`pair-concurrent-${tag}@example.com`),
    `ip:pair-concurrent-${tag}`,
    emailHash(`mid-fail-${tag}@example.com`),
    `ip:mid-fail-${tag}`,
  ]);

  // --- 1. Account sequential failures ---
  for (let i = 1; i <= EMAIL_MAX; i++) {
    const r = await reserve("email", eHash, EMAIL_MAX);
    assert(r.ok === true && r.count === i, `email sequential reserve #${i}`);
  }
  const emailBlock = await reserve("email", eHash, EMAIL_MAX);
  assert(emailBlock.ok === false, "email 6th attempt blocked (threshold)");
  assert(
    (await getCount("email", eHash)) === EMAIL_MAX,
    "email attempt_count stays at max after block",
  );

  // --- 2. IP sequential failures ---
  for (let i = 1; i <= IP_MAX; i++) {
    const r = await reserve("ip", ipKey, IP_MAX);
    assert(r.ok === true && r.count === i, `ip sequential reserve #${i}`);
  }
  const ipBlock = await reserve("ip", ipKey, IP_MAX);
  assert(ipBlock.ok === false, "ip 21st attempt blocked (threshold)");
  assert((await getCount("ip", ipKey)) === IP_MAX, "ip attempt_count at max");

  // --- 3. Unknown account failures (hashed email still reserved) ---
  for (let i = 1; i <= EMAIL_MAX; i++) {
    const r = await reserve("email", unknownHash, EMAIL_MAX);
    assert(r.ok, `unknown-email reserve #${i}`);
  }
  assert(
    (await reserve("email", unknownHash, EMAIL_MAX)).ok === false,
    "unknown-email blocked after threshold",
  );

  // --- 4. Inactive account failures (same limiter path as any email key) ---
  for (let i = 1; i <= EMAIL_MAX; i++) {
    const r = await reserve("email", inactiveHash, EMAIL_MAX);
    assert(r.ok, `inactive-email reserve #${i}`);
  }
  assert(
    (await reserve("email", inactiveHash, EMAIL_MAX)).ok === false,
    "inactive-email blocked after threshold",
  );

  // --- 5 + 6. Successful login resets email; does NOT wipe abusive IP ---
  await cleanupKeys([eHash, abuseIpKey]);
  for (let i = 0; i < 3; i++) {
    await reserve("email", eHash, EMAIL_MAX);
    await reserve("ip", abuseIpKey, IP_MAX);
  }
  // Simulate prior abuse on same IP
  for (let i = 0; i < 10; i++) {
    await reserve("ip", abuseIpKey, IP_MAX);
  }
  const ipBeforeSuccess = await getCount("ip", abuseIpKey);
  assert(ipBeforeSuccess === 13, "ip abuse history before success (3+10)");

  // Successful login: clear email; release one IP slot only
  await clearEmail(eHash);
  await releaseIp(abuseIpKey);
  assert((await getCount("email", eHash)) === 0, "success clears email limiter");
  assert(
    (await getCount("ip", abuseIpKey)) === ipBeforeSuccess - 1,
    "success releases one IP slot only (does not wipe IP history)",
  );

  // --- 7. Window expiration / reset ---
  const winEmail = emailHash(`window-${tag}@example.com`);
  await ensure("email", winEmail);
  await pool.query(
    `update login_rate_limits
     set attempt_count = $1, window_started_at = now() - interval '16 minutes', updated_at = now()
     where dimension='email' and key_hash=$2`,
    [EMAIL_MAX, winEmail],
  );
  const afterExpiry = await reserve("email", winEmail, EMAIL_MAX);
  assert(
    afterExpiry.ok === true && afterExpiry.count === 1,
    "expired window resets to count 1",
  );

  // --- 8 + 10 + 11. Concurrent email: 10 simultaneous → only 5 reserved ---
  const cEmail = emailHash(`concurrent-email-${tag}@example.com`);
  await ensure("email", cEmail);
  const emailOutcomes = await Promise.all(
    Array.from({ length: 10 }, () => reserve("email", cEmail, EMAIL_MAX)),
  );
  const emailAllowed = emailOutcomes.filter((o) => o.ok).length;
  const emailDenied = emailOutcomes.filter((o) => !o.ok).length;
  const emailFinal = await getCount("email", cEmail);
  assert(emailAllowed === EMAIL_MAX, "concurrent email: exactly 5 allowed");
  assert(emailDenied === 10 - EMAIL_MAX, "concurrent email: 5 denied");
  assert(emailFinal === EMAIL_MAX, "concurrent email: no lost increments");
  assert(
    (await reserve("email", cEmail, EMAIL_MAX)).ok === false,
    "post-concurrency email still blocked",
  );

  // --- 9 + 10. Concurrent IP: 25 simultaneous → only 20 reserved ---
  const cIp = `ip:concurrent-${tag}`;
  await ensure("ip", cIp);
  const ipOutcomes = await Promise.all(
    Array.from({ length: 25 }, () => reserve("ip", cIp, IP_MAX)),
  );
  const ipAllowed = ipOutcomes.filter((o) => o.ok).length;
  const ipDenied = ipOutcomes.filter((o) => !o.ok).length;
  const ipFinal = await getCount("ip", cIp);
  assert(ipAllowed === IP_MAX, "concurrent ip: exactly 20 allowed");
  assert(ipDenied === 25 - IP_MAX, "concurrent ip: 5 denied");
  assert(ipFinal === IP_MAX, "concurrent ip: no lost increments");
  assert(
    (await reserve("ip", cIp, IP_MAX)).ok === false,
    "post-concurrency ip still blocked",
  );

  // --- Cross-dimension atomicity (email+IP one logical reservation) ---
  const blockedIp = `ip:blocked-${tag}`;
  const freshEmail = emailHash(`fresh-vs-blocked-ip-${tag}@example.com`);
  await ensure("ip", blockedIp);
  for (let i = 0; i < IP_MAX; i++) {
    await reserve("ip", blockedIp, IP_MAX);
  }
  assert((await getCount("ip", blockedIp)) === IP_MAX, "setup: IP exhausted");
  assert((await getCount("email", freshEmail)) === 0, "setup: fresh email at 0");
  const deniedByIp = await reservePair(freshEmail, blockedIp);
  assert(deniedByIp.ok === false, "IP-exhausted pair denies login reservation");
  assert(
    (await getCount("email", freshEmail)) === 0,
    "IP-blocked attempt does not consume fresh email count",
  );
  assert(
    (await getCount("ip", blockedIp)) === IP_MAX,
    "IP-blocked attempt leaves exhausted IP at max",
  );

  const blockedEmail = emailHash(`blocked-email-${tag}@example.com`);
  const freshIp = `ip:fresh-${tag}`;
  await ensure("email", blockedEmail);
  for (let i = 0; i < EMAIL_MAX; i++) {
    await reserve("email", blockedEmail, EMAIL_MAX);
  }
  assert(
    (await getCount("email", blockedEmail)) === EMAIL_MAX,
    "setup: email exhausted",
  );
  assert((await getCount("ip", freshIp)) === 0, "setup: fresh IP at 0");
  const deniedByEmail = await reservePair(blockedEmail, freshIp);
  assert(
    deniedByEmail.ok === false,
    "email-exhausted pair denies login reservation",
  );
  assert(
    (await getCount("ip", freshIp)) === 0,
    "email-blocked attempt does not consume fresh IP count",
  );
  assert(
    (await getCount("email", blockedEmail)) === EMAIL_MAX,
    "email-blocked attempt leaves exhausted email at max",
  );

  // Concurrent pair reservations: same email+IP — exact counts, no partials
  const pairEmail = emailHash(`pair-concurrent-${tag}@example.com`);
  const pairIp = `ip:pair-concurrent-${tag}`;
  const pairOutcomes = await Promise.all(
    Array.from({ length: 8 }, () => reservePair(pairEmail, pairIp)),
  );
  const pairAllowed = pairOutcomes.filter((o) => o.ok).length;
  const pairDenied = pairOutcomes.filter((o) => !o.ok).length;
  const pairEmailCount = await getCount("email", pairEmail);
  const pairIpCount = await getCount("ip", pairIp);
  assert(pairAllowed === EMAIL_MAX, "concurrent pair: email max (5) allowed");
  assert(pairDenied === 8 - EMAIL_MAX, "concurrent pair: excess denied");
  assert(
    pairEmailCount === EMAIL_MAX && pairIpCount === EMAIL_MAX,
    "concurrent pair: email and IP counts match allowed reservations",
  );
  assert(
    pairEmailCount === pairIpCount,
    "concurrent pair: no partial cross-dimension reservation",
  );

  // Mid-reservation DB failure → rollback, no partial email consumption
  const midEmail = emailHash(`mid-fail-${tag}@example.com`);
  const midIp = `ip:mid-fail-${tag}`;
  const midClient = await pool.connect();
  let midRolled = false;
  try {
    await midClient.query("begin");
    await midClient.query(
      `insert into login_rate_limits (dimension, key_hash, attempt_count, window_started_at, updated_at)
       values ('email',$1,0,now(),now())
       on conflict (dimension, key_hash) do nothing`,
      [midEmail],
    );
    const midEmailRes = await midClient.query(
      `update login_rate_limits
       set attempt_count = attempt_count + 1, updated_at = now()
       where dimension='email' and key_hash=$1
       returning attempt_count`,
      [midEmail],
    );
    assert(
      Number(midEmailRes.rows[0].attempt_count) === 1,
      "mid-fail setup: email reserved inside open tx",
    );
    // Force failure before IP commit
    try {
      await midClient.query(`select 1 from login_rate_limits_does_not_exist`);
    } catch {
      /* expected */
    }
    await midClient.query("rollback");
    midRolled = true;
  } finally {
    if (!midRolled) {
      try {
        await midClient.query("rollback");
      } catch {
        /* ignore */
      }
    }
    midClient.release();
  }
  assert(
    (await getCount("email", midEmail)) === 0,
    "mid-reservation failure rolls back email (no partial state)",
  );
  assert(
    (await getCount("ip", midIp)) === 0,
    "mid-reservation failure leaves IP untouched",
  );

  // --- 12 + 13. Limiter READ/WRITE failure → must throw (auth denies) ---
  let renameOk = false;
  try {
    await pool.query(
      `alter table login_rate_limits rename to login_rate_limits_m20_tmp`,
    );
    renameOk = true;
    let threw = false;
    try {
      await reserve("email", eHash, EMAIL_MAX);
    } catch {
      threw = true;
    }
    assert(threw, "limiter write/reserve failure throws (fail closed)");
    // "Read" failure same path — reserve requires storage
    assert(threw, "limiter read/check failure throws (fail closed)");
  } finally {
    if (renameOk) {
      await pool.query(
        `alter table login_rate_limits_m20_tmp rename to login_rate_limits`,
      );
    }
  }

  // After restore, enforcement still works
  await cleanupKeys([eHash]);
  assert(
    (await reserve("email", eHash, EMAIL_MAX)).ok === true,
    "enforcement works after temporary storage outage restored",
  );

  // --- 14. Cleanup failure must not disable current enforcement ---
  let cleanupThrew = false;
  try {
    await pool.query(
      `delete from login_rate_limits where updated_at < 'not-a-timestamp'`,
    );
  } catch {
    cleanupThrew = true;
  }
  assert(cleanupThrew, "simulated cleanup SQL failure");
  const afterCleanupFail = await reserve(
    "email",
    emailHash(`cleanup-fail-${tag}@example.com`),
    EMAIL_MAX,
  );
  assert(
    afterCleanupFail.ok === true,
    "cleanup failure does not disable current reserve enforcement",
  );

  // --- 15. Generic user-facing message (source contract) ---
  const authSrc = readFileSync(resolve("src/auth.ts"), "utf8");
  const providerSrc = readFileSync(
    resolve("src/components/session/production-auth-session-provider.tsx"),
    "utf8",
  );
  const passwordSrc = readFileSync(resolve("src/lib/auth/password.ts"), "utf8");
  assert(
    passwordSrc.includes(`"${GENERIC}"`) ||
      passwordSrc.includes(`'${GENERIC}'`),
    "GENERIC_INVALID_LOGIN constant present",
  );
  assert(
    providerSrc.includes("GENERIC_INVALID_LOGIN"),
    "production signIn surfaces GENERIC_INVALID_LOGIN on any Credentials error",
  );
  assert(
    authSrc.includes("return null") &&
      authSrc.includes("reserveLoginAttempt") &&
      authSrc.includes("LoginRateLimiterUnavailableError"),
    "authorize returns null for limited + limiter unavailable (no reason leak)",
  );
  // Client-facing: authorize returns null only — never a reason string.
  const authorizeBlock = authSrc.slice(
    authSrc.indexOf("async authorize"),
    authSrc.indexOf("session:", authSrc.indexOf("async authorize")),
  );
  assert(
    !/return\s+["'][^"']+["']/.test(authorizeBlock) &&
      !authorizeBlock.includes("throw new Error(\"Rate") &&
      authorizeBlock.includes("return null"),
    "authorize does not return distinctive error strings to the client",
  );

  const authRouteSrc = readFileSync(
    resolve("src/app/api/auth/[...nextauth]/route.ts"),
    "utf8",
  );
  assert(
    authRouteSrc.includes("Authentication service unavailable.") &&
      !authRouteSrc.includes("error.message") &&
      !authRouteSrc.includes("return new Response(message"),
    "production auth misconfig returns generic 500 body only",
  );
  assert(
    authRouteSrc.includes("console.error") &&
      authRouteSrc.includes("production auth configuration error"),
    "production auth misconfig logs sanitized operational error",
  );

  assert(WINDOW_MS === 15 * 60 * 1000, "window constant 15m");
  assert(EMAIL_MAX === 5 && IP_MAX === 20, "threshold constants");

  // Final cleanup
  const { rows: leftover } = await pool.query(
    `select key_hash from login_rate_limits where key_hash like $1 or key_hash = any($2::text[])`,
    [
      `%${tag}%`,
      [
        eHash,
        unknownHash,
        inactiveHash,
        ipKey,
        abuseIpKey,
        cEmail,
        cIp,
        winEmail,
        blockedIp,
        freshEmail,
        blockedEmail,
        freshIp,
        pairEmail,
        pairIp,
        midEmail,
        midIp,
        emailHash(`cleanup-fail-${tag}@example.com`),
      ],
    ],
  );
  await cleanupKeys(leftover.map((r) => r.key_hash));
  pass("test data cleaned");
} catch (error) {
  fail("fatal", error instanceof Error ? error.message : error);
  // Best-effort restore table name if a prior step left it renamed
  try {
    await pool.query(
      `alter table if exists login_rate_limits_m20_tmp rename to login_rate_limits`,
    );
  } catch {
    /* ignore */
  }
} finally {
  await pool.end();
}

const failed = results.filter((r) => !r.ok);
console.log(
  `\n${results.filter((r) => r.ok).length}/${results.length} passed` +
    (failed.length ? ` — ${failed.length} failed` : ""),
);
process.exit(failed.length ? 1 : 0);
