import { DEMO_COMPANY_DEFAULTS } from "@/lib/company/demo-defaults";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import { nextLineId, nextQuoteId } from "@/lib/quotes/demo-data";
import type {
  DiscountType,
  LineCategory,
  Quote,
  QuoteCustomerSnapshot,
  QuoteLineItem,
} from "@/types/quote";

export function createEmptyLine(
  existing: QuoteLineItem[],
  category: LineCategory = "Services",
): QuoteLineItem {
  return {
    id: nextLineId(existing),
    category,
    description: "",
    quantity: 1,
    unitPrice: 0,
    unit: "",
    internalNotes: "",
    sortOrder: existing.length,
    lineTotal: 0,
  };
}

export function buildNewDraftQuote(
  existing: Quote[],
  today: Date,
  snapshot: QuoteCustomerSnapshot,
  overrides?: Partial<
    Pick<
      Quote,
      | "jobDescription"
      | "preparedBy"
      | "taxRate"
      | "discountType"
      | "discountValue"
      | "customerFacingMessage"
      | "termsAndConditions"
      | "internalNotes"
      | "lineItems"
    >
  >,
): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  const defaults = DEMO_COMPANY_DEFAULTS;
  const draft: Quote = {
    id: nextQuoteId(existing),
    customerSnapshot: snapshot,
    jobDescription: overrides?.jobDescription ?? "",
    status: "Draft",
    quoteDate: todayIso,
    validUntil: toIsoDate(
      addDays(startOfDay(today), defaults.quoteValidityDays),
    ),
    preparedBy: overrides?.preparedBy ?? defaults.preparedBy,
    internalNotes: overrides?.internalNotes ?? "",
    customerFacingMessage:
      overrides?.customerFacingMessage ?? defaults.customerFacingMessage,
    termsAndConditions:
      overrides?.termsAndConditions ?? defaults.termsAndConditions,
    taxRate: overrides?.taxRate ?? defaults.taxRate,
    discountType: (overrides?.discountType ??
      defaults.discountType) as DiscountType,
    discountValue: overrides?.discountValue ?? defaults.discountValue,
    lineItems: overrides?.lineItems ?? [],
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    createdAt: todayIso,
    updatedAt: todayIso,
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    archivedAt: null,
    archived: false,
    statusBeforeArchive: null,
  };
  return withRecalculatedTotals(draft);
}

export function duplicateQuote(
  source: Quote,
  existing: Quote[],
  today: Date,
): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  const defaults = DEMO_COMPANY_DEFAULTS;
  const copy: Quote = {
    id: nextQuoteId(existing),
    customerSnapshot: source.customerSnapshot
      ? { ...source.customerSnapshot }
      : null,
    jobDescription: source.jobDescription,
    status: "Draft",
    quoteDate: todayIso,
    validUntil: toIsoDate(
      addDays(startOfDay(today), defaults.quoteValidityDays),
    ),
    preparedBy: source.preparedBy,
    internalNotes: source.internalNotes,
    customerFacingMessage: source.customerFacingMessage,
    termsAndConditions: source.termsAndConditions,
    taxRate: source.taxRate,
    discountType: source.discountType,
    discountValue: source.discountValue,
    lineItems: source.lineItems.map((item, index) => ({
      ...item,
      id: `LINE-${String(index + 1).padStart(4, "0")}`,
      sortOrder: index,
    })),
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    createdAt: todayIso,
    updatedAt: todayIso,
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    archivedAt: null,
    archived: false,
    statusBeforeArchive: null,
  };
  return withRecalculatedTotals(copy);
}

export function archiveQuote(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    archived: true,
    archivedAt: todayIso,
    statusBeforeArchive: quote.status,
    updatedAt: todayIso,
  };
}

export function restoreQuote(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    archived: false,
    archivedAt: null,
    status: quote.statusBeforeArchive ?? "Draft",
    statusBeforeArchive: null,
    updatedAt: todayIso,
  };
}

export function markQuoteSent(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    status: "Sent",
    sentAt: todayIso,
    updatedAt: todayIso,
  };
}

export function returnQuoteToDraft(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    status: "Draft",
    updatedAt: todayIso,
  };
}

export function markQuoteAccepted(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    status: "Accepted",
    acceptedAt: todayIso,
    updatedAt: todayIso,
  };
}

export function markQuoteRejected(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    status: "Rejected",
    rejectedAt: todayIso,
    updatedAt: todayIso,
  };
}

export function markQuoteExpired(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    ...quote,
    status: "Expired",
    expiredAt: todayIso,
    updatedAt: todayIso,
  };
}

export function reactivateQuoteToDraft(quote: Quote, today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  const defaults = DEMO_COMPANY_DEFAULTS;
  return {
    ...quote,
    status: "Draft",
    validUntil: toIsoDate(
      addDays(startOfDay(today), defaults.quoteValidityDays),
    ),
    expiredAt: null,
    updatedAt: todayIso,
  };
}

export function quoteIsEditable(quote: Quote): boolean {
  if (quote.archived) return false;
  return quote.status === "Draft" || quote.status === "Sent";
}

export function moveLine(
  lines: QuoteLineItem[],
  lineId: string,
  direction: "up" | "down",
): QuoteLineItem[] {
  const index = lines.findIndex((line) => line.id === lineId);
  if (index < 0) return lines;
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= lines.length) return lines;
  const next = [...lines];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);
  return next.map((line, sortOrder) => ({ ...line, sortOrder }));
}
