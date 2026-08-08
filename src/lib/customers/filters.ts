import type { Customer, CustomerFormValues } from "@/types/customer";
import { customerDisplayName } from "@/types/customer";

export type CustomerArchiveFilter = "active" | "archived";

export type CustomerSortOption =
  | "name"
  | "company"
  | "city"
  | "quotes"
  | "lastQuote"
  | "recentlyAdded"
  | "recentlyUpdated";

export type CustomerFilters = {
  query: string;
  archive: CustomerArchiveFilter;
  company: string;
  city: string;
  sort: CustomerSortOption;
  sortDir: "asc" | "desc";
};

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilters = {
  query: "",
  archive: "active",
  company: "",
  city: "",
  sort: "name",
  sortDir: "asc",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function getDistinctCompanies(customers: Customer[]): string[] {
  return Array.from(
    new Set(
      customers
        .map((customer) => customer.companyName.trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));
}

export function getDistinctCities(customers: Customer[]): string[] {
  return Array.from(
    new Set(customers.map((customer) => customer.city.trim()).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}

export function matchesCustomerSearch(
  customer: Customer,
  query: string,
): boolean {
  const q = normalize(query);
  if (!q) return true;

  const haystack = [
    customer.firstName,
    customer.lastName,
    customerDisplayName(customer),
    customer.companyName,
    customer.phone,
    customer.email,
    customer.street,
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) return true;

  const queryDigits = q.replace(/\D/g, "");
  if (queryDigits.length >= 3) {
    const phoneDigits = customer.phone.replace(/\D/g, "");
    if (phoneDigits.includes(queryDigits)) return true;
  }

  return false;
}

export function filterCustomers(
  customers: Customer[],
  filters: CustomerFilters,
): Customer[] {
  const filtered = customers.filter((customer) => {
    const archiveOk =
      filters.archive === "active" ? !customer.archived : customer.archived;
    if (!archiveOk) return false;
    if (filters.company && customer.companyName !== filters.company) {
      return false;
    }
    if (filters.city && customer.city !== filters.city) return false;
    return matchesCustomerSearch(customer, filters.query);
  });

  const direction = filters.sortDir === "asc" ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "recentlyAdded":
        return b.createdAt.localeCompare(a.createdAt);
      case "recentlyUpdated":
        return b.updatedAt.localeCompare(a.updatedAt);
      case "company":
        return (
          a.companyName.localeCompare(b.companyName) * direction ||
          customerDisplayName(a).localeCompare(customerDisplayName(b))
        );
      case "city":
        return (
          a.city.localeCompare(b.city) * direction ||
          customerDisplayName(a).localeCompare(customerDisplayName(b))
        );
      case "quotes":
        return (a.totalQuotes - b.totalQuotes) * direction;
      case "lastQuote": {
        const aDate = a.lastQuoteDate ?? "";
        const bDate = b.lastQuoteDate ?? "";
        return aDate.localeCompare(bDate) * direction;
      }
      case "name":
      default:
        return (
          customerDisplayName(a).localeCompare(customerDisplayName(b)) *
          direction
        );
    }
  });
}

export type CustomerFieldErrors = Partial<
  Record<keyof CustomerFormValues, string>
>;

export function validateCustomerForm(
  values: CustomerFormValues,
): CustomerFieldErrors {
  const errors: CustomerFieldErrors = {};

  if (!values.firstName.trim()) errors.firstName = "First name is required.";
  if (!values.lastName.trim()) errors.lastName = "Last name is required.";
  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!isValidPhone(values.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.street.trim()) errors.street = "Street address is required.";
  if (!values.city.trim()) errors.city = "City is required.";
  if (!values.state.trim()) errors.state = "State is required.";
  if (!values.zip.trim()) {
    errors.zip = "ZIP code is required.";
  } else if (!/^\d{5}$/.test(values.zip.trim())) {
    errors.zip = "Enter a 5-digit US ZIP code.";
  }
  if (values.email.trim() && !isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }

  return errors;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** Basic formatting check: at least 10 digits; allows spaces, dashes, parentheses. */
function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return false;
  return /^[\d\s().+-]+$/.test(value.trim());
}

export function hasActiveListFilters(filters: CustomerFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.company ||
      filters.city ||
      filters.sort === "recentlyAdded" ||
      filters.sort === "recentlyUpdated",
  );
}

/** Search/company/city only — used for empty-state branching. */
export function hasRestrictiveListFilters(filters: CustomerFilters): boolean {
  return Boolean(filters.query.trim() || filters.company || filters.city);
}
