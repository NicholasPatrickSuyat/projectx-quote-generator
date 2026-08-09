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
import {
  QUOTE_STATUSES,
  type DemoQuote,
  type QuoteStatus,
} from "@/types/quote";

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

export function activeQuotes(quotes: DemoQuote[]): DemoQuote[] {
  return quotes.filter((quote) => !quote.archived);
}

/** Current non-archived totals by status. Not date-filtered. */
export function getStatusCounts(quotes: DemoQuote[]): StatusCounts {
  const counts = Object.fromEntries(
    QUOTE_STATUSES.map((status) => [status, 0]),
  ) as StatusCounts;

  for (const quote of activeQuotes(quotes)) {
    counts[quote.status] += 1;
  }

  return counts;
}

export function getSummaryMetrics(
  quotes: DemoQuote[],
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
    if (isDateInRange(quote.sentAt, range)) {
      quotesSent += 1;
    }
    if (isDateInRange(quote.acceptedAt, range)) {
      quotesAccepted += 1;
      acceptedQuoteValue += quote.total;
    }
    if (
      quote.expiresAt &&
      quote.expiresAt >= todayIso &&
      quote.expiresAt <= soonIso &&
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
  quotes: DemoQuote[],
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
      number: quote.number,
      customerName: quote.customerName,
      meta: `Draft since ${formatShortDate(quote.createdAt)}`,
      // Filter-only deep-links until Dashboard/Quotes demo seeds are unified.
      href: `/quotes?attention=drafts-stale`,
    }));

  const expiringSoon = active
    .filter(
      (quote) =>
        quote.expiresAt &&
        quote.expiresAt >= todayIso &&
        quote.expiresAt <= soonIso &&
        (quote.status === "Draft" || quote.status === "Sent"),
    )
    .sort((a, b) => (a.expiresAt ?? "").localeCompare(b.expiresAt ?? ""))
    .slice(0, ATTENTION_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.number,
      customerName: quote.customerName,
      meta: `Expires ${formatShortDate(quote.expiresAt ?? quote.createdAt)}`,
      href: `/quotes?expiringSoon=1`,
    }));

  const recentlySent = active
    .filter((quote) => quote.status === "Sent")
    .sort((a, b) => (b.sentAt ?? "").localeCompare(a.sentAt ?? ""))
    .slice(0, ATTENTION_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.number,
      customerName: quote.customerName,
      meta: `Sent ${formatShortDate(quote.sentAt ?? quote.createdAt)}`,
      href: `/quotes?attention=awaiting-response`,
    }));

  return { staleDrafts, expiringSoon, recentlySent };
}
