import type { CompanyLogo } from "@/types/company";

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

/** Alias used by the frozen PDF snapshot model. */
export type QuoteDiscountType = DiscountType;

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

/** Frozen sent-PDF snapshot — historical source of truth for Final PDFs. */
export type QuotePdfSnapshot = {
  frozenAt: string;
  company: {
    companyName: string;
    logo: CompanyLogo;
    phone: string;
    email: string;
    website: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    currency: "USD";
    pdfFooterText: string;
  };
  quote: {
    quoteId: string;
    quoteDate: string;
    validUntil: string | null;
    preparedBy: string;
    jobDescription: string;
    customerFacingMessage: string;
    termsAndConditions: string;
    customerSnapshot: QuoteCustomerSnapshot;
    lineItems: QuoteLineItem[];
    subtotalCents: number;
    discountType: QuoteDiscountType;
    discountValue: number;
    discountAmountCents: number;
    taxRate: number;
    taxAmountCents: number;
    grandTotalCents: number;
  };
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
  /** Present after Mark as Sent / Final PDF; cleared on Return to Draft. */
  pdfSnapshot: QuotePdfSnapshot | null;
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
