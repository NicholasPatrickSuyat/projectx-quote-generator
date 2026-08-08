export type CustomerRecordStatus = "Active" | "Archived";

export type CustomerRecentQuote = {
  id: string;
  number: string;
  status: "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";
  date: string;
  total: number;
};

export type Customer = {
  id: string;
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
