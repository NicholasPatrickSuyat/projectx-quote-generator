import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import {
  findCustomerSnapshot,
  nextQuoteId,
} from "@/lib/quotes/demo-data";
import type { Quote, QuoteCustomerSnapshot } from "@/types/quote";

const EMPTY_SNAPSHOT: QuoteCustomerSnapshot = {
  customerId: "",
  customerName: "Unassigned customer",
  companyName: "",
  phone: "",
  email: "",
  street: "",
  city: "",
  state: "",
  zip: "",
};

export function createDraftQuoteStub(
  existing: Quote[],
  today: Date,
  customerId?: string | null,
): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  const snapshot =
    (customerId ? findCustomerSnapshot(customerId) : null) ?? EMPTY_SNAPSHOT;

  return {
    id: nextQuoteId(existing),
    customerSnapshot: snapshot,
    jobDescription: "",
    status: "Draft",
    quoteDate: todayIso,
    validUntil: toIsoDate(addDays(startOfDay(today), 30)),
    preparedBy: "Alex Rivera",
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
}

export function duplicateQuote(source: Quote, existing: Quote[], today: Date): Quote {
  const todayIso = toIsoDate(startOfDay(today));
  return {
    id: nextQuoteId(existing),
    customerSnapshot: { ...source.customerSnapshot },
    jobDescription: source.jobDescription,
    status: "Draft",
    quoteDate: todayIso,
    validUntil: toIsoDate(addDays(startOfDay(today), 30)),
    preparedBy: source.preparedBy,
    grandTotal: source.grandTotal,
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
