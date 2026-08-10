import { normalizeEmail } from "@/lib/auth/demo-auth";
import { nextUserId } from "@/lib/users/demo-data";
import { wouldRemoveLastActiveAdmin } from "@/lib/users/validation";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { User, UserFormValues } from "@/types/user";

export function createUser(
  existing: User[],
  values: UserFormValues,
  today: Date = new Date(),
): User {
  const day = toIsoDate(startOfDay(today));
  return {
    id: nextUserId(existing),
    fullName: values.fullName.trim(),
    email: normalizeEmail(values.email),
    role: values.role,
    active: values.active,
    profilePicture: null,
    createdAt: day,
    updatedAt: day,
  };
}

export function updateUser(
  user: User,
  values: UserFormValues,
  today: Date = new Date(),
): User {
  return {
    ...user,
    fullName: values.fullName.trim(),
    email: normalizeEmail(values.email),
    role: values.role,
    active: values.active,
    updatedAt: toIsoDate(startOfDay(today)),
  };
}

export function setUserActive(
  users: User[],
  userId: string,
  active: boolean,
  today: Date = new Date(),
): { users: User[]; error: string | null } {
  const target = users.find((user) => user.id === userId);
  if (!target) {
    return { users, error: "User not found." };
  }

  if (
    wouldRemoveLastActiveAdmin(users, userId, {
      role: target.role,
      active,
    })
  ) {
    return {
      users,
      error: "The application must keep at least one active Admin.",
    };
  }

  const day = toIsoDate(startOfDay(today));
  return {
    users: users.map((user) =>
      user.id === userId ? { ...user, active, updatedAt: day } : user,
    ),
    error: null,
  };
}
