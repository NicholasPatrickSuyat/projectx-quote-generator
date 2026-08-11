import {
  type DateRange,
  isDateInRange,
} from "@/lib/dashboard/date-presets";
import {
  addDays,
  formatShortDate,
  startOfDay,
  toIsoDate,
} from "@/lib/format";
import { QUOTE_STATUSES, type Quote, type QuoteStatus } from "@/types/quote";

const ATTENTION_LIMIT = 5;

export type StatusCounts = Record<QuoteStatus, number>;

export type SummaryMetrics = {
  quotesCreated: number;
  quotesSent: number;
  quotesAccepted: number;
  acceptedQuoteValue: number;
  expiringWithin7Days: number;
};

export type AttentionItem = {
  id: string;
  number: string;
  customerName: string;
  meta: string;
  href: string;
};

export type NeedsAttention = {
  staleDrafts: AttentionItem[];
  expiringSoon: AttentionItem[];
  recentlySent: AttentionItem[];
};

function customerName(quote: Quote): string {
  return quote.customerSnapshot?.customerName?.trim() || "Unknown customer";
}

export function activeQuotes(quotes: Quote[]): Quote[] {
  return quotes.filter((quote) => !quote.archived);
}

/** Current non-archived totals by status. Not date-filtered. */
export function getStatusCounts(quotes: Quote[]): StatusCounts {
  const counts = Object.fromEntries(
    QUOTE_STATUSES.map((status) => [status, 0]),
  ) as StatusCounts;

  for (const quote of activeQuotes(quotes)) {
    counts[quote.status] += 1;
  }

  return counts;
}

export function getSummaryMetrics(
  quotes: Quote[],
  range: DateRange,
  today: Date = new Date(),
): SummaryMetrics {
  const active = activeQuotes(quotes);
  const todayIso = toIsoDate(startOfDay(today));
  const soonIso = toIsoDate(addDays(startOfDay(today), 7));

  let quotesCreated = 0;
  let quotesSent = 0;
  let quotesAccepted = 0;
  let acceptedQuoteValue = 0;
  let expiringWithin7Days = 0;

  for (const quote of active) {
    if (isDateInRange(quote.createdAt, range)) {
      quotesCreated += 1;
    }
    if (quote.sentAt && isDateInRange(quote.sentAt, range)) {
      quotesSent += 1;
    }
    if (quote.acceptedAt && isDateInRange(quote.acceptedAt, range)) {
      quotesAccepted += 1;
      acceptedQuoteValue += quote.grandTotal;
    }
    if (
      quote.validUntil &&
      quote.validUntil >= todayIso &&
      quote.validUntil <= soonIso &&
      (quote.status === "Draft" || quote.status === "Sent")
    ) {
      expiringWithin7Days += 1;
    }
  }

  return {
    quotesCreated,
    quotesSent,
    quotesAccepted,
    acceptedQuoteValue,
    expiringWithin7Days,
  };
}

export function getNeedsAttention(
  quotes: Quote[],
  today: Date = new Date(),
): NeedsAttention {
  const active = activeQuotes(quotes);
  const todayStart = startOfDay(today);
  const todayIso = toIsoDate(todayStart);
  const staleCutoff = toIsoDate(addDays(todayStart, -7));
  const soonIso = toIsoDate(addDays(todayStart, 7));

  const staleDrafts = active
    .filter(
      (quote) => quote.status === "Draft" && quote.createdAt < staleCutoff,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, ATTENTION_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.id,
      customerName: customerName(quote),
      meta: `Draft since ${formatShortDate(quote.createdAt)}`,
      href: `/quotes?attention=drafts-stale`,
    }));

  const expiringSoon = active
    .filter(
      (quote) =>
        quote.validUntil &&
        quote.validUntil >= todayIso &&
        quote.validUntil <= soonIso &&
        (quote.status === "Draft" || quote.status === "Sent"),
    )
    .sort((a, b) => (a.validUntil ?? "").localeCompare(b.validUntil ?? ""))
    .slice(0, ATTENTION_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.id,
      customerName: customerName(quote),
      meta: `Expires ${formatShortDate(quote.validUntil ?? quote.createdAt)}`,
      href: `/quotes?expiringSoon=1`,
    }));

  const recentlySent = active
    .filter((quote) => quote.status === "Sent")
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""))
    .slice(0, ATTENTION_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.id,
      customerName: customerName(quote),
      meta: `Sent ${formatShortDate(quote.sentAt ?? quote.createdAt)}`,
      href: `/quotes?attention=awaiting-response`,
    }));

  return { staleDrafts, expiringSoon, recentlySent };
}
