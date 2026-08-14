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

export type QuoteCustomerSnapshot = {
  /** Customer UUID (live relationship key). */
  customerId: string;
  /** Business customer number at snapshot time (CUST-000001). */
  customerNumber: string;
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
  /** Internal UUID. */
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
    /** Business quote number shown on the PDF (QUO-000001). */
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

/** Full quote record for Quotes list + Builder. */
export type Quote = {
  /** Internal UUID primary key. */
  id: string;
  /** Business identifier shown in UI / PDF (QUO-000001). */
  quoteNumber: string;
  customerSnapshot: QuoteCustomerSnapshot | null;
  jobDescription: string;
  status: QuoteStatus;
  quoteDate: string;
  validUntil: string | null;
  preparedBy: string;
  /** Production-auth actor when known; null in demo/session or after user deletion. */
  preparedByUserId: string | null;
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
    customerNumber: "",
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
