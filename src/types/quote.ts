export const QUOTE_STATUSES = [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const LINE_CATEGORIES = ["Services", "Materials", "Labor"] as const;
export type LineCategory = (typeof LINE_CATEGORIES)[number];

export type DiscountType = "none" | "percent" | "fixed";

/** Lightweight quote shape used by the Dashboard demo metrics. */
export type DemoQuote = {
  id: string;
  number: string;
  customerName: string;
  status: QuoteStatus;
  total: number;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  expiresAt?: string;
  archived?: boolean;
};

export type QuoteCustomerSnapshot = {
  customerId: string;
  customerName: string;
  companyName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type QuoteLineItem = {
  id: string;
  category: LineCategory;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
  internalNotes: string;
  sortOrder: number;
  lineTotal: number;
};

/** Full quote record for Quotes list + Builder (session-only). */
export type Quote = {
  id: string;
  customerSnapshot: QuoteCustomerSnapshot | null;
  jobDescription: string;
  status: QuoteStatus;
  quoteDate: string;
  validUntil: string | null;
  preparedBy: string;
  internalNotes: string;
  customerFacingMessage: string;
  termsAndConditions: string;
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
  lineItems: QuoteLineItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  expiredAt: string | null;
  archivedAt: string | null;
  archived: boolean;
  statusBeforeArchive: QuoteStatus | null;
};

export function quoteStatusTone(
  status: QuoteStatus,
): "draft" | "sent" | "accepted" | "rejected" | "expired" {
  switch (status) {
    case "Draft":
      return "draft";
    case "Sent":
      return "sent";
    case "Accepted":
      return "accepted";
    case "Rejected":
      return "rejected";
    case "Expired":
      return "expired";
  }
}

export function emptyCustomerSnapshot(): QuoteCustomerSnapshot {
  return {
    customerId: "",
    customerName: "",
    companyName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  };
}
