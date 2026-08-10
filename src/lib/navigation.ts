export type NavIconId =
  | "dashboard"
  | "customers"
  | "quotes"
  | "catalog"
  | "settings"
  | "users";

export type NavItem = {
  label: string;
  href: string;
  icon: NavIconId;
  /** When set, item is shown only if this capability is true. */
  requiresCapability?:
    | "canManageSettings"
    | "canManageUsers";
};

export const APP_NAME = "Quote Generator Pro";
export const DEMO_COMPANY_NAME = "Project X Mechanical Services";

/** V1 sidebar destinations — filtered by role capabilities at render time. */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Customers", href: "/customers", icon: "customers" },
  { label: "Quotes", href: "/quotes", icon: "quotes" },
  { label: "Service Catalog", href: "/catalog", icon: "catalog" },
  {
    label: "Users",
    href: "/users",
    icon: "users",
    requiresCapability: "canManageUsers",
  },
  {
    label: "Company Settings",
    href: "/settings",
    icon: "settings",
    requiresCapability: "canManageSettings",
  },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
