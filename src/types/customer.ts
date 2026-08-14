export type CustomerRecordStatus = "Active" | "Archived";

export type CustomerRecentQuote = {
  /** Quote UUID (internal). */
  id: string;
  /** Business quote number, e.g. QUO-000001. */
  number: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
  date: string;
  total: number;
};

export type Customer = {
  /** Internal UUID primary key. */
  id: string;
  /** Business identifier shown in UI / deep links (CUST-000001). */
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  /** Derived from quotes — not persisted as source of truth. */
  totalQuotes: number;
  draftQuotes: number;
  acceptedQuotes: number;
  lastQuoteDate: string | null;
  recentQuotes: CustomerRecentQuote[];
};

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  internalNotes: string;
};

export function customerDisplayName(customer: Pick<Customer, "firstName" | "lastName">): string {
  return `${customer.firstName} ${customer.lastName}`.trim();
}

export function customerCityState(customer: Pick<Customer, "city" | "state">): string {
  return `${customer.city}, ${customer.state}`;
}

export function customerRecordStatus(
  customer: Pick<Customer, "archived">,
): CustomerRecordStatus {
  return customer.archived ? "Archived" : "Active";
}
