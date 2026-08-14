/**
 * Auth.js (next-auth v5) — Credentials + JWT only (M18/M20).
 * No OAuth providers / no Auth.js database adapter tables.
 *
 * Session freshness: JWT carries authVersion. On session access the jwt
 * callback reloads the user (throttled) and invalidates the token when
 * inactive or authVersion mismatches (password reset / role change / deactivate).
 *
 * M20: Neon-backed login rate limiting (email + trusted IP) before password check.
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  getAuthMode,
  assertAuthSecretPresent,
  assertProductionAuthConfigured,
} from "@/lib/auth/mode";
import { extractTrustedClientIp } from "@/lib/auth/client-ip";
import {
  finalizeSuccessfulLogin,
  LoginRateLimitedError,
  LoginRateLimiterUnavailableError,
  reserveLoginAttempt,
} from "@/lib/auth/login-rate-limit";
import { getPersistenceMode } from "@/lib/persistence/mode";
import { verifyPassword } from "@/lib/auth/password";
import { credentialsSchema } from "@/lib/auth/validation";
import {
  findUserAuthStateById,
  findUserByEmailForLogin,
} from "@/lib/persistence/db-users-repository";
import type { UserRole } from "@/types/user";

/** Office-appropriate JWT lifetime (7 days). */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const SESSION_UPDATE_AGE_SECONDS = 60 * 60 * 24;

/**
 * How often the jwt callback re-checks DB authVersion/active.
 * Auth.js invokes jwt when the session is accessed (e.g. /api/auth/session),
 * not on every React render. 30s balances Neon load vs revocation latency.
 */
export const AUTH_VERSION_RECHECK_MS = 30_000;

function resolveSecret(): string {
  if (getAuthMode() === "production") {
    return assertAuthSecretPresent();
  }
  // Demo mode never issues production Credentials sessions; placeholder allows
  // the Auth.js module/route to load without AUTH_SECRET on public demo.
  return (
    process.env.AUTH_SECRET?.trim() ||
    "auth-mode-demo-unused-placeholder-not-for-login"
  );
}

function invalidateToken(token: Record<string, unknown>) {
  return {
    ...token,
    sub: undefined,
    email: undefined,
    role: undefined,
    companyId: undefined,
    fullName: undefined,
    authVersion: undefined,
    error: "SessionInvalid" as const,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: resolveSecret(),
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (getAuthMode() !== "production") {
          return null;
        }
        // Fail closed: production auth requires database + secret.
        assertProductionAuthConfigured();

        if (getPersistenceMode() !== "database") {
          throw new Error(
            "AUTH_MODE=production requires PERSISTENCE_MODE=database for Credentials login.",
          );
        }

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const normalizedEmail = parsed.data.email;
        const clientIp = extractTrustedClientIp(request);
        const rateInput = { normalizedEmail, clientIp };

        // Atomic reserve BEFORE user lookup / password verify (closes TOCTOU).
        // Limiter storage failure → deny (fail closed). Same generic null to client.
        try {
          await reserveLoginAttempt(rateInput);
        } catch (error) {
          if (
            error instanceof LoginRateLimitedError ||
            error instanceof LoginRateLimiterUnavailableError
          ) {
            return null;
          }
          console.error("[auth] login rate limiter error — denying login");
          return null;
        }

        let row: Awaited<ReturnType<typeof findUserByEmailForLogin>>;
        try {
          row = await findUserByEmailForLogin(normalizedEmail);
        } catch {
          console.error("[auth] login user lookup error — denying login");
          return null;
        }

        // Unknown, inactive, or bad password: reservation already consumed.
        // Do not reveal which case; do not attempt a second limiter write.
        if (!row || !row.active) {
          return null;
        }

        const valid = await verifyPassword(
          parsed.data.password,
          row.passwordHash,
        );
        if (!valid) {
          return null;
        }

        // Success: clear email row; release one IP reservation (not full IP wipe).
        await finalizeSuccessfulLogin(rateInput);

        return {
          id: row.id,
          email: row.email,
          name: row.fullName,
          role: row.role,
          companyId: row.companyId,
          authVersion: row.authVersion,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
    updateAge: SESSION_UPDATE_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (getAuthMode() !== "production") {
        return token;
      }

      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
        token.fullName = user.name ?? "";
        token.email = user.email;
        token.authVersion = user.authVersion;
        token.authCheckedAt = Date.now();
        delete token.error;
        return token;
      }

      if (token.error === "SessionInvalid" || !token.sub) {
        return invalidateToken(token as Record<string, unknown>) as typeof token;
      }

      const checkedAt =
        typeof token.authCheckedAt === "number" ? token.authCheckedAt : 0;
      if (Date.now() - checkedAt < AUTH_VERSION_RECHECK_MS) {
        return token;
      }

      try {
        const row = await findUserAuthStateById(String(token.sub));
        if (
          !row ||
          !row.active ||
          row.authVersion !== Number(token.authVersion)
        ) {
          return invalidateToken(token as Record<string, unknown>) as typeof token;
        }

        // Refresh claims from authoritative DB (role changes reflected for UX).
        token.role = row.role;
        token.fullName = row.fullName;
        token.email = row.email;
        token.companyId = row.companyId;
        token.authVersion = row.authVersion;
        token.authCheckedAt = Date.now();
        delete token.error;
        return token;
      } catch {
        // Fail closed on DB errors during revalidation.
        return invalidateToken(token as Record<string, unknown>) as typeof token;
      }
    },
    async session({ session, token }) {
      if (token.error === "SessionInvalid" || !token.sub) {
        return {
          ...session,
          user: undefined as unknown as typeof session.user,
          error: "SessionInvalid" as const,
          expires: new Date(0).toISOString(),
        };
      }

      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = String(token.email ?? "");
        session.user.fullName = String(token.fullName ?? "");
        session.user.role = token.role as UserRole;
        session.user.companyId = String(token.companyId ?? "");
        session.user.authVersion = Number(token.authVersion ?? 0);
      }
      session.error = undefined;
      return session;
    },
  },
});
