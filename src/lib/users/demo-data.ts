import {
  DEMO_ADMIN_EMAIL,
  DEMO_SEED_PASSWORDS,
  DEMO_STAFF_EMAIL,
} from "@/lib/auth/demo-auth";
import { toIsoDate, startOfDay } from "@/lib/format";
import type { User, UserFormValues } from "@/types/user";

export function getDemoUsers(today: Date = new Date()): User[] {
  const day = toIsoDate(startOfDay(today));
  return [
    {
      id: "user-admin-001",
      fullName: "Alex Rivera",
      email: DEMO_ADMIN_EMAIL,
      role: "Admin",
      active: true,
      profilePicture: null,
      createdAt: day,
      updatedAt: day,
    },
    {
      id: "user-staff-001",
      fullName: "Jordan Lee",
      email: DEMO_STAFF_EMAIL,
      role: "Office Staff",
      active: true,
      profilePicture: null,
      createdAt: day,
      updatedAt: day,
    },
  ];
}

/** Initial DEMO-ONLY credential map for seed users. */
export function getDemoCredentialMap(): Record<string, string> {
  return { ...DEMO_SEED_PASSWORDS };
}

export function emptyUserForm(): UserFormValues {
  return {
    fullName: "",
    email: "",
    role: "Office Staff",
    active: true,
    password: "",
  };
}

export function userToFormValues(user: User): UserFormValues {
  return {
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    active: user.active,
    password: "",
  };
}

export function nextUserId(existing: User[]): string {
  let max = 0;
  for (const user of existing) {
    const match = /^user-(?:admin|staff|custom)-(\d+)$/i.exec(user.id);
    if (match) {
      max = Math.max(max, Number(match[1]));
    }
  }
  return `user-custom-${String(max + 1).padStart(3, "0")}`;
}
