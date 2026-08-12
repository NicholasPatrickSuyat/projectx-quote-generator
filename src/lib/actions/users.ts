"use server";

import {
  AuthorizationError,
  requireDatabaseMutationCapability,
  requireDatabaseUsersRead,
} from "@/lib/auth/session";
import {
  createUserInputSchema,
  updateUserInputSchema,
  passwordSchema,
} from "@/lib/auth/validation";
import {
  createAppUser,
  listUsersForCompany,
  resetAppUserPassword,
  setAppUserActive,
  updateAppUser,
  type AppUserDomain,
} from "@/lib/persistence/db-users-repository";
import type { UserFieldErrors } from "@/lib/users/validation";
import type { User, UserFormValues } from "@/types/user";

function toPublicUser(row: AppUserDomain): User {
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    role: row.role,
    active: row.active,
    profilePicture: row.profilePicture,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function zodToFieldErrors(
  error: import("zod").ZodError,
): UserFieldErrors {
  const errors: UserFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "fullName") errors.fullName = issue.message;
    else if (key === "email") errors.email = issue.message;
    else if (key === "role") errors.role = issue.message;
    else if (key === "password") errors.password = issue.message;
    else errors.form = issue.message;
  }
  return errors;
}

function mapAuthError(error: unknown): UserFieldErrors {
  if (error instanceof AuthorizationError) {
    return { form: error.message };
  }
  if (error instanceof Error) {
    return { form: error.message };
  }
  return { form: "Something went wrong." };
}

export async function listUsersFromDb(): Promise<User[]> {
  const actor = await requireDatabaseUsersRead();
  const rows = await listUsersForCompany(actor.companyId);
  return rows.map(toPublicUser);
}

/** List for session hydration — requires manage-users capability. */
export async function loadManagedUsersAction(): Promise<{
  users: User[];
  error: string | null;
}> {
  try {
    const users = await listUsersFromDb();
    return { users, error: null };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { users: [], error: error.message };
    }
    return {
      users: [],
      error: error instanceof Error ? error.message : "Failed to load users.",
    };
  }
}

export async function createUserInDb(
  values: UserFormValues,
): Promise<{ user: User | null; errors: UserFieldErrors }> {
  try {
    await requireDatabaseMutationCapability("canManageUsers");
    const parsed = createUserInputSchema.safeParse({
      fullName: values.fullName,
      email: values.email,
      role: values.role,
      active: values.active,
      password: values.password,
    });
    if (!parsed.success) {
      return { user: null, errors: zodToFieldErrors(parsed.error) };
    }
    const created = await createAppUser(parsed.data);
    return { user: toPublicUser(created), errors: {} };
  } catch (error) {
    return { user: null, errors: mapAuthError(error) };
  }
}

export async function updateUserInDb(
  id: string,
  values: UserFormValues,
): Promise<{ user: User | null; errors: UserFieldErrors }> {
  try {
    await requireDatabaseMutationCapability("canManageUsers");
    const parsed = updateUserInputSchema.safeParse({
      fullName: values.fullName,
      email: values.email,
      role: values.role,
      active: values.active,
      password: values.password,
    });
    if (!parsed.success) {
      return { user: null, errors: zodToFieldErrors(parsed.error) };
    }
    const updated = await updateAppUser(id, parsed.data);
    return { user: toPublicUser(updated), errors: {} };
  } catch (error) {
    return { user: null, errors: mapAuthError(error) };
  }
}

export async function setUserActiveInDb(
  id: string,
  active: boolean,
): Promise<{ user: User | null; error: string | null }> {
  try {
    await requireDatabaseMutationCapability("canManageUsers");
    const updated = await setAppUserActive(id, active);
    return { user: toPublicUser(updated), error: null };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { user: null, error: error.message };
    }
    return {
      user: null,
      error: error instanceof Error ? error.message : "Update failed.",
    };
  }
}

export async function resetUserPasswordInDb(
  id: string,
  newPassword: string,
): Promise<{ error: string | null }> {
  try {
    await requireDatabaseMutationCapability("canManageUsers");
    const parsed = passwordSchema.safeParse(newPassword);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
    }
    await resetAppUserPassword(id, parsed.data);
    return { error: null };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { error: error.message };
    }
    return {
      error: error instanceof Error ? error.message : "Password reset failed.",
    };
  }
}
