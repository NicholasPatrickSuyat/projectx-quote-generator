export type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "customers" | "quotes" | "catalog" | "settings";
};

export const APP_NAME = "Quote Generator Pro";
export const DEMO_COMPANY_NAME = "Project X Mechanical Services";

/** V1 sidebar destinations only — from approved UI/UX Planning. */
export const MAIN_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "dashboard" },
  { label: "Customers", href: "/customers", icon: "customers" },
  { label: "Quotes", href: "/quotes", icon: "quotes" },
  { label: "Service Catalog", href: "/catalog", icon: "catalog" },
  { label: "Company Settings", href: "/settings", icon: "settings" },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
