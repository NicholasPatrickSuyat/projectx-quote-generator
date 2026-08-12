/**
 * Database-backed application users (AUTH_MODE=production).
 */

import { and, asc, count, eq, ne, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { appUsers, company } from "@/lib/db/schema";
import { normalizeEmail, hashPassword } from "@/lib/auth/password";
import type { CreateUserInput, UpdateUserInput } from "@/lib/auth/validation";
import { wouldRemoveLastActiveAdmin } from "@/lib/users/validation";
import type { User, UserRole } from "@/types/user";
import { assertDatabaseAccessAllowed } from "@/lib/persistence/mode";

export type AppUserRow = typeof appUsers.$inferSelect;

export type AppUserDomain = User & { companyId: string };

/** Authoritative auth fields for session validation (includes authVersion). */
export type AppUserAuthState = {
  id: string;
  companyId: string;
  fullName: string;
  email: string;
  role: UserRole;
  active: boolean;
  authVersion: number;
};

/** Includes passwordHash — server/login only; never send to client. */
export type AppUserLoginRow = AppUserRow;

function toDomain(row: AppUserRow): AppUserDomain {
  return {
    id: row.id,
    companyId: row.companyId,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    active: row.active,
    profilePicture: row.profilePicture,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
  };
}

function toAuthState(row: AppUserRow): AppUserAuthState {
  return {
    id: row.id,
    companyId: row.companyId,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    active: row.active,
    authVersion: row.authVersion,
  };
}

async function requireSingleCompanyId(): Promise<string> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const rows = await db.select({ id: company.id }).from(company).limit(2);
  if (rows.length === 0) {
    throw new Error(
      "No company row found. Run db:bootstrap:company before managing users.",
    );
  }
  if (rows.length > 1) {
    throw new Error(
      "Multiple company rows found. Single-company installation required.",
    );
  }
  return rows[0].id;
}

export async function findUserByEmailForLogin(
  email: string,
): Promise<AppUserLoginRow | null> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const normalized = normalizeEmail(email);
  const rows = await db
    .select()
    .from(appUsers)
    .where(sql`lower(${appUsers.email}) = ${normalized}`)
    .limit(1);
  return rows[0] ?? null;
}

export async function findUserById(
  id: string,
): Promise<AppUserDomain | null> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, id))
    .limit(1);
  return rows[0] ? toDomain(rows[0]) : null;
}

export async function findUserAuthStateById(
  id: string,
): Promise<AppUserAuthState | null> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.id, id))
    .limit(1);
  return rows[0] ? toAuthState(rows[0]) : null;
}

export async function listUsers(): Promise<AppUserDomain[]> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  return listUsersForCompany(companyId);
}

/** Company-scoped user directory (caller must authorize + supply trusted companyId). */
export async function listUsersForCompany(
  companyId: string,
): Promise<AppUserDomain[]> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const rows = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.companyId, companyId))
    .orderBy(asc(appUsers.fullName));
  return rows.map(toDomain);
}

export async function countUsers(): Promise<number> {
  assertDatabaseAccessAllowed();
  const db = getDb();
  const [row] = await db.select({ value: count() }).from(appUsers);
  return Number(row?.value ?? 0);
}

export async function countActiveAdmins(
  options?: { excludeUserId?: string },
): Promise<number> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  const db = getDb();
  const conditions = [
    eq(appUsers.companyId, companyId),
    eq(appUsers.role, "Admin"),
    eq(appUsers.active, true),
  ];
  if (options?.excludeUserId) {
    conditions.push(ne(appUsers.id, options.excludeUserId));
  }
  const [row] = await db
    .select({ value: count() })
    .from(appUsers)
    .where(and(...conditions));
  return Number(row?.value ?? 0);
}

export async function createAppUser(
  input: CreateUserInput,
): Promise<AppUserDomain> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  const db = getDb();
  const email = normalizeEmail(input.email);

  const existing = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(
      and(
        eq(appUsers.companyId, companyId),
        sql`lower(${appUsers.email}) = ${email}`,
      ),
    )
    .limit(1);
  if (existing.length > 0) {
    throw new Error("Another user already uses this email.");
  }

  const passwordHash = await hashPassword(input.password);
  const [row] = await db
    .insert(appUsers)
    .values({
      companyId,
      fullName: input.fullName.trim(),
      email,
      passwordHash,
      role: input.role,
      active: input.active,
      authVersion: 1,
      profilePicture: null,
      updatedAt: new Date(),
    })
    .returning();

  return toDomain(row);
}

function shouldBumpAuthVersion(
  existing: AppUserRow,
  next: { role: UserRole; active: boolean; passwordChanging: boolean },
): boolean {
  if (next.passwordChanging) return true;
  if (existing.role !== next.role) return true;
  if (existing.active && !next.active) return true; // deactivation
  return false;
}

export async function updateAppUser(
  id: string,
  input: UpdateUserInput,
): Promise<AppUserDomain> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  const db = getDb();
  const existingRows = await db
    .select()
    .from(appUsers)
    .where(and(eq(appUsers.id, id), eq(appUsers.companyId, companyId)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new Error("User not found.");
  }

  const allUsers = await listUsersForCompany(companyId);
  if (
    wouldRemoveLastActiveAdmin(allUsers, id, {
      role: input.role,
      active: input.active,
    })
  ) {
    throw new Error("The application must keep at least one active Admin.");
  }

  const email = normalizeEmail(input.email);
  const duplicate = await db
    .select({ id: appUsers.id })
    .from(appUsers)
    .where(
      and(
        eq(appUsers.companyId, companyId),
        sql`lower(${appUsers.email}) = ${email}`,
        ne(appUsers.id, id),
      ),
    )
    .limit(1);
  if (duplicate.length > 0) {
    throw new Error("Another user already uses this email.");
  }

  const passwordChanging = Boolean(input.password && input.password.length > 0);
  const bump = shouldBumpAuthVersion(existing, {
    role: input.role,
    active: input.active,
    passwordChanging,
  });

  const patch: Partial<AppUserRow> = {
    fullName: input.fullName.trim(),
    email,
    role: input.role,
    active: input.active,
    updatedAt: new Date(),
  };

  if (passwordChanging) {
    patch.passwordHash = await hashPassword(input.password);
  }
  if (bump) {
    patch.authVersion = existing.authVersion + 1;
  }

  const [row] = await db
    .update(appUsers)
    .set(patch)
    .where(eq(appUsers.id, id))
    .returning();

  return toDomain(row);
}

export async function setAppUserActive(
  id: string,
  active: boolean,
): Promise<AppUserDomain> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  const db = getDb();
  const existingRows = await db
    .select()
    .from(appUsers)
    .where(and(eq(appUsers.id, id), eq(appUsers.companyId, companyId)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new Error("User not found.");
  }

  const allUsers = await listUsersForCompany(companyId);
  if (
    wouldRemoveLastActiveAdmin(allUsers, id, {
      role: existing.role as UserRole,
      active,
    })
  ) {
    throw new Error("The application must keep at least one active Admin.");
  }

  const bump = existing.active && !active; // deactivation only
  const [row] = await db
    .update(appUsers)
    .set({
      active,
      updatedAt: new Date(),
      ...(bump ? { authVersion: existing.authVersion + 1 } : {}),
    })
    .where(eq(appUsers.id, id))
    .returning();

  return toDomain(row);
}

export async function resetAppUserPassword(
  id: string,
  newPassword: string,
): Promise<void> {
  assertDatabaseAccessAllowed();
  const companyId = await requireSingleCompanyId();
  const db = getDb();
  const existingRows = await db
    .select({ id: appUsers.id, authVersion: appUsers.authVersion })
    .from(appUsers)
    .where(and(eq(appUsers.id, id), eq(appUsers.companyId, companyId)))
    .limit(1);
  if (existingRows.length === 0) {
    throw new Error("User not found.");
  }
  const passwordHash = await hashPassword(newPassword);
  await db
    .update(appUsers)
    .set({
      passwordHash,
      authVersion: existingRows[0].authVersion + 1,
      updatedAt: new Date(),
    })
    .where(and(eq(appUsers.id, id), eq(appUsers.companyId, companyId)));
}
