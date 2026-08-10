import type { User } from "@/types/user";

export type UserStatusFilter = "all" | "active" | "inactive";
export type UserRoleFilter = "all" | "Admin" | "Office Staff";
export type UserSortOption = "name" | "email" | "role" | "status" | "updated";

export type UserFilters = {
  query: string;
  status: UserStatusFilter;
  role: UserRoleFilter;
  sort: UserSortOption;
  sortDir: "asc" | "desc";
};

export const DEFAULT_USER_FILTERS: UserFilters = {
  query: "",
  status: "all",
  role: "all",
  sort: "name",
  sortDir: "asc",
};

export function filterUsers(users: User[], filters: UserFilters): User[] {
  const q = filters.query.trim().toLowerCase();

  let result = users.filter((user) => {
    if (filters.status === "active" && !user.active) return false;
    if (filters.status === "inactive" && user.active) return false;
    if (filters.role !== "all" && user.role !== filters.role) return false;

    if (!q) return true;
    return (
      user.fullName.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });

  const dir = filters.sortDir === "asc" ? 1 : -1;
  result = [...result].sort((a, b) => {
    let cmp = 0;
    switch (filters.sort) {
      case "email":
        cmp = a.email.localeCompare(b.email);
        break;
      case "role":
        cmp = a.role.localeCompare(b.role);
        break;
      case "status":
        cmp = Number(b.active) - Number(a.active);
        break;
      case "updated":
        cmp = a.updatedAt.localeCompare(b.updatedAt);
        break;
      case "name":
      default:
        cmp = a.fullName.localeCompare(b.fullName);
        break;
    }
    return cmp * dir;
  });

  return result;
}

export function hasActiveUserFilters(filters: UserFilters): boolean {
  return (
    filters.query.trim().length > 0 ||
    filters.status !== "all" ||
    filters.role !== "all"
  );
}
