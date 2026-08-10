import { normalizeEmail } from "@/lib/auth/demo-auth";
import type { User, UserFormValues, UserRole } from "@/types/user";

export type UserFieldErrors = {
  fullName?: string;
  email?: string;
  role?: string;
  demoPassword?: string;
  form?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function countActiveAdmins(
  users: User[],
  options?: { excludeUserId?: string },
): number {
  return users.filter(
    (user) =>
      user.active &&
      user.role === "Admin" &&
      user.id !== options?.excludeUserId,
  ).length;
}

/**
 * Returns true when the proposed change would leave zero active Admins.
 */
export function wouldRemoveLastActiveAdmin(
  users: User[],
  userId: string,
  next: Pick<User, "role" | "active">,
): boolean {
  const target = users.find((user) => user.id === userId);
  if (!target) return false;

  const currentlyActiveAdmin = target.active && target.role === "Admin";
  if (!currentlyActiveAdmin) return false;

  const remainsActiveAdmin = next.active && next.role === "Admin";
  if (remainsActiveAdmin) return false;

  return countActiveAdmins(users, { excludeUserId: userId }) === 0;
}

export function validateUserForm(
  values: UserFormValues,
  users: User[],
  options: { mode: "create" | "edit"; userId?: string },
): UserFieldErrors {
  const errors: UserFieldErrors = {};
  const fullName = values.fullName.trim();
  const email = normalizeEmail(values.email);

  if (!fullName) {
    errors.fullName = "Full name is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Enter a valid email address.";
  } else {
    const duplicate = users.some(
      (user) =>
        normalizeEmail(user.email) === email &&
        user.id !== options.userId,
    );
    if (duplicate) {
      errors.email = "Another user already uses this email.";
    }
  }

  if (!values.role) {
    errors.role = "Role is required.";
  }

  if (options.mode === "create" && !values.demoPassword.trim()) {
    errors.demoPassword =
      "A demo password is required for new users (demo auth only).";
  }

  if (options.mode === "edit" && options.userId) {
    if (
      wouldRemoveLastActiveAdmin(users, options.userId, {
        role: values.role,
        active: values.active,
      })
    ) {
      errors.form =
        "The application must keep at least one active Admin.";
    }
  }

  return errors;
}

export function isValidUserRole(value: string): value is UserRole {
  return value === "Admin" || value === "Office Staff";
}
