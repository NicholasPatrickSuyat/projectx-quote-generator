/**
 * Neon-backed login rate limiting (M20 Gate 1).
 *
 * Threshold semantics (explicit):
 * - EMAIL max = 5 → at most **5** attempts may be *reserved* per 15-minute window
 *   for a normalized email. The **6th** attempt is blocked *before* password
 *   verification (atomic UPDATE … WHERE attempt_count < 5 matches 0 rows).
 * - IP max = 20 → same pattern for trusted client IP (21st blocked before verify).
 *
 * Design: reserve-before-verify. Email + trusted-IP reservations for one login
 * attempt run in a **single Neon/Drizzle interactive transaction** so a denial
 * on either dimension rolls back the other (no partial consumption).
 *
 * Successful login:
 * - delete the email/account row (full reset of that dimension)
 * - decrement IP attempt_count by 1 (release this attempt’s reservation only)
 *
 * Unknown / inactive / bad-password: reservation kept (enumeration-safe).
 * Limiter DB errors on reserve: throw — caller must deny login (fail closed).
 * Cleanup errors: best-effort only; must not disable current-attempt enforcement.
 */

import { createHash } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { getDb, type AppDatabase } from "@/lib/db/client";
import { loginRateLimits } from "@/lib/db/schema";
import { assertServerModule } from "@/lib/server-module";

assertServerModule("@/lib/auth/login-rate-limit");

export const LOGIN_RATE_WINDOW_MS = 15 * 60 * 1000;
/** Max reserved attempts per email per window (6th blocked before verify). */
export const LOGIN_RATE_EMAIL_MAX = 5;
/** Max reserved attempts per trusted IP per window (21st blocked before verify). */
export const LOGIN_RATE_IP_MAX = 20;
/** Lazy cleanup: drop rows not touched for this long. */
export const LOGIN_RATE_ROW_TTL_MS = 24 * 60 * 60 * 1000;

export type LoginRateDimension = "email" | "ip";

type DbExecutor = AppDatabase | Parameters<Parameters<AppDatabase["transaction"]>[0]>[0];

export class LoginRateLimitedError extends Error {
  readonly code = "LOGIN_RATE_LIMITED";
  constructor() {
    super("LOGIN_RATE_LIMITED");
    this.name = "LoginRateLimitedError";
  }
}

/** Thrown when limiter storage cannot be updated — callers must deny login. */
export class LoginRateLimiterUnavailableError extends Error {
  readonly code = "LOGIN_RATE_LIMITER_UNAVAILABLE";
  constructor(cause?: unknown) {
    super("LOGIN_RATE_LIMITER_UNAVAILABLE", {
      cause: cause instanceof Error ? cause : undefined,
    });
    this.name = "LoginRateLimiterUnavailableError";
  }
}

function hashEmailKey(normalizedEmail: string): string {
  return createHash("sha256").update(`email:${normalizedEmail}`).digest("hex");
}

function ipKey(ip: string): string {
  return `ip:${ip}`;
}

async function lazyCleanupBestEffort(now: Date): Promise<void> {
  try {
    const cutoff = new Date(now.getTime() - LOGIN_RATE_ROW_TTL_MS);
    await getDb()
      .delete(loginRateLimits)
      .where(lt(loginRateLimits.updatedAt, cutoff));
  } catch {
    // Cleanup must not disable enforcement of the current attempt.
    console.error("[auth] login rate limiter cleanup error");
  }
}

async function ensureRow(
  db: DbExecutor,
  dimension: LoginRateDimension,
  keyHash: string,
  now: Date,
): Promise<void> {
  await db
    .insert(loginRateLimits)
    .values({
      dimension,
      keyHash,
      attemptCount: 0,
      windowStartedAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing({
      target: [loginRateLimits.dimension, loginRateLimits.keyHash],
    });
}

/**
 * Atomically reserve one attempt for a dimension on the given executor.
 * Returns the new authoritative attempt_count when allowed.
 * Throws LoginRateLimitedError when the window is already at capacity.
 */
async function reserveAttemptOn(
  db: DbExecutor,
  dimension: LoginRateDimension,
  keyHash: string,
  maxAttempts: number,
  now: Date,
): Promise<number> {
  await ensureRow(db, dimension, keyHash, now);
  const windowStartCutoff = new Date(now.getTime() - LOGIN_RATE_WINDOW_MS);

  const rows = await db
    .update(loginRateLimits)
    .set({
      attemptCount: sql`case
        when ${loginRateLimits.windowStartedAt} < ${windowStartCutoff}
        then 1
        else ${loginRateLimits.attemptCount} + 1
      end`,
      windowStartedAt: sql`case
        when ${loginRateLimits.windowStartedAt} < ${windowStartCutoff}
        then ${now}
        else ${loginRateLimits.windowStartedAt}
      end`,
      updatedAt: now,
    })
    .where(
      and(
        eq(loginRateLimits.dimension, dimension),
        eq(loginRateLimits.keyHash, keyHash),
        sql`(
          ${loginRateLimits.windowStartedAt} < ${windowStartCutoff}
          or ${loginRateLimits.attemptCount} < ${maxAttempts}
        )`,
      ),
    )
    .returning({ attemptCount: loginRateLimits.attemptCount });

  if (!rows[0]) {
    throw new LoginRateLimitedError();
  }
  return rows[0].attemptCount;
}

/**
 * Single-dimension reserve (own short transaction). Prefer reserveLoginAttempt
 * for login so email+IP stay atomic together.
 */
export async function reserveAttempt(
  dimension: LoginRateDimension,
  keyHash: string,
  maxAttempts: number,
  now: Date = new Date(),
): Promise<number> {
  try {
    return await getDb().transaction(async (tx) =>
      reserveAttemptOn(tx, dimension, keyHash, maxAttempts, now),
    );
  } catch (error) {
    if (error instanceof LoginRateLimitedError) throw error;
    throw new LoginRateLimiterUnavailableError(error);
  }
}

export type LoginRateCheckInput = {
  normalizedEmail: string;
  clientIp: string | null;
};

/**
 * Reserve email (+ trusted IP) as one logical operation in a single transaction.
 * If either dimension cannot be reserved, the whole transaction rolls back —
 * no permanent partial consumption of the other dimension for this attempt.
 * Fail closed on limiter storage errors.
 */
export async function reserveLoginAttempt(
  input: LoginRateCheckInput,
): Promise<void> {
  const now = new Date();
  await lazyCleanupBestEffort(now);

  const emailKey = hashEmailKey(input.normalizedEmail);
  const trustedIpKey = input.clientIp ? ipKey(input.clientIp) : null;

  try {
    await getDb().transaction(async (tx) => {
      // Consistent lock order: email row, then IP row (avoids cross-request deadlock).
      await reserveAttemptOn(tx, "email", emailKey, LOGIN_RATE_EMAIL_MAX, now);
      if (trustedIpKey) {
        await reserveAttemptOn(tx, "ip", trustedIpKey, LOGIN_RATE_IP_MAX, now);
      }
    });
  } catch (error) {
    if (error instanceof LoginRateLimitedError) throw error;
    throw new LoginRateLimiterUnavailableError(error);
  }
}

/** @deprecated Prefer reserveLoginAttempt. */
export async function assertLoginAttemptAllowed(
  input: LoginRateCheckInput,
): Promise<void> {
  return reserveLoginAttempt(input);
}

/** Clear account/email failure state after successful password verification. */
export async function clearLoginFailuresForEmail(
  normalizedEmail: string,
): Promise<void> {
  try {
    await getDb()
      .delete(loginRateLimits)
      .where(
        and(
          eq(loginRateLimits.dimension, "email"),
          eq(loginRateLimits.keyHash, hashEmailKey(normalizedEmail)),
        ),
      );
  } catch {
    console.error("[auth] login rate limiter clear email error");
  }
}

/**
 * Release one IP reservation after a successful login.
 * Does not delete the IP row or wipe abusive history.
 */
export async function releaseIpReservation(clientIp: string): Promise<void> {
  try {
    const now = new Date();
    await getDb()
      .update(loginRateLimits)
      .set({
        attemptCount: sql`greatest(${loginRateLimits.attemptCount} - 1, 0)`,
        updatedAt: now,
      })
      .where(
        and(
          eq(loginRateLimits.dimension, "ip"),
          eq(loginRateLimits.keyHash, ipKey(clientIp)),
        ),
      );
  } catch {
    console.error("[auth] login rate limiter release IP error");
  }
}

/**
 * After successful password verification: reset email dimension; release one IP slot.
 */
export async function finalizeSuccessfulLogin(
  input: LoginRateCheckInput,
): Promise<void> {
  await clearLoginFailuresForEmail(input.normalizedEmail);
  if (input.clientIp) {
    await releaseIpReservation(input.clientIp);
  }
  await lazyCleanupBestEffort(new Date());
}

/** Test helper — email key hash (no secrets). */
export function hashLoginEmailKeyForTests(normalizedEmail: string): string {
  return hashEmailKey(normalizedEmail);
}

/** Test helper — IP key string. */
export function loginIpKeyForTests(ip: string): string {
  return ipKey(ip);
}
