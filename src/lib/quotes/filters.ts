import {
  getDateRange,
  isDateInRange,
  type DatePresetId,
} from "@/lib/dashboard/date-presets";
import { addDays, startOfDay, toIsoDate } from "@/lib/format";
import type { Quote, QuoteStatus } from "@/types/quote";
import { QUOTE_STATUSES } from "@/types/quote";

export type QuoteArchiveFilter = "active" | "archived";

export type QuoteAttentionFilter = "drafts-stale" | "awaiting-response" | null;

export type QuoteSortKey =
  | "quoteId"
  | "customer"
  | "job"
  | "status"
  | "quoteDate"
  | "validUntil"
  | "sentAt"
  | "grandTotal"
  | "preparedBy";

export type QuoteFilters = {
  search: string;
  archive: QuoteArchiveFilter;
  status: QuoteStatus | "all";
  customerName: string | "all";
  datePreset: DatePresetId | "all";
  expiringSoon: boolean;
  attention: QuoteAttentionFilter;
};

export const DEFAULT_QUOTE_FILTERS: QuoteFilters = {
  search: "",
  archive: "active",
  status: "all",
  customerName: "all",
  datePreset: "all",
  expiringSoon: false,
  attention: null,
};

export function isQuoteStatus(value: string): value is QuoteStatus {
  return (QUOTE_STATUSES as readonly string[]).includes(value);
}

export function quoteMatchesSearch(quote: Quote, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    quote.id,
    quote.customerSnapshot.customerName,
    quote.customerSnapshot.companyName,
    quote.jobDescription,
    quote.preparedBy,
    quote.status,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

/** Draft created more than 7 full days ago, not archived. */
export function isStaleDraft(quote: Quote, today: Date): boolean {
  if (quote.archived || quote.status !== "Draft") return false;
  const created = startOfDay(new Date(`${quote.createdAt}T00:00:00`));
  const cutoff = addDays(startOfDay(today), -7);
  return created.getTime() < cutoff.getTime();
}

/** Valid Until is today through next 7 days; Draft or Sent; not archived. */
export function isExpiringSoon(quote: Quote, today: Date): boolean {
  if (quote.archived) return false;
  if (quote.status !== "Draft" && quote.status !== "Sent") return false;
  if (!quote.validUntil) return false;
  const start = toIsoDate(startOfDay(today));
  const end = toIsoDate(addDays(startOfDay(today), 7));
  return quote.validUntil >= start && quote.validUntil <= end;
}

export function filterQuotes(
  quotes: Quote[],
  filters: QuoteFilters,
  today: Date = new Date(),
): Quote[] {
  let result = quotes.filter((quote) =>
    filters.archive === "archived" ? quote.archived : !quote.archived,
  );

  if (filters.attention === "drafts-stale") {
    result = result.filter((quote) => isStaleDraft(quote, today));
  } else if (filters.attention === "awaiting-response") {
    result = result.filter(
      (quote) => !quote.archived && quote.status === "Sent",
    );
  }

  if (filters.expiringSoon) {
    result = result.filter((quote) => isExpiringSoon(quote, today));
  }

  if (filters.status !== "all") {
    result = result.filter((quote) => quote.status === filters.status);
  }

  if (filters.customerName !== "all") {
    result = result.filter(
      (quote) => quote.customerSnapshot.customerName === filters.customerName,
    );
  }

  if (filters.datePreset !== "all") {
    const range = getDateRange(filters.datePreset, today);
    result = result.filter((quote) => isDateInRange(quote.quoteDate, range));
  }

  if (filters.search.trim()) {
    result = result.filter((quote) =>
      quoteMatchesSearch(quote, filters.search),
    );
  }

  return result;
}

export function sortQuotes(
  quotes: Quote[],
  sortKey: QuoteSortKey,
  sortDir: "asc" | "desc",
): Quote[] {
  const dir = sortDir === "asc" ? 1 : -1;

  return [...quotes].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "quoteId":
        cmp = a.id.localeCompare(b.id);
        break;
      case "customer":
        cmp = a.customerSnapshot.customerName.localeCompare(
          b.customerSnapshot.customerName,
        );
        break;
      case "job":
        cmp = a.jobDescription.localeCompare(b.jobDescription);
        break;
      case "status":
        cmp = a.status.localeCompare(b.status);
        break;
      case "quoteDate":
        cmp = a.quoteDate.localeCompare(b.quoteDate);
        break;
      case "validUntil":
        cmp = (a.validUntil ?? "").localeCompare(b.validUntil ?? "");
        break;
      case "sentAt":
        cmp = (a.sentAt ?? "").localeCompare(b.sentAt ?? "");
        break;
      case "grandTotal":
        cmp = a.grandTotal - b.grandTotal;
        break;
      case "preparedBy":
        cmp = a.preparedBy.localeCompare(b.preparedBy);
        break;
    }
    if (cmp !== 0) return cmp * dir;
    return a.id.localeCompare(b.id) * dir;
  });
}

export function distinctCustomerNames(quotes: Quote[]): string[] {
  const names = new Set(
    quotes.map((quote) => quote.customerSnapshot.customerName),
  );
  return [...names].sort((a, b) => a.localeCompare(b));
}

export type QuoteFilterChip = {
  id: string;
  label: string;
};

export function getActiveQuoteFilterChips(
  filters: QuoteFilters,
): QuoteFilterChip[] {
  const chips: QuoteFilterChip[] = [];

  if (filters.archive === "archived") {
    chips.push({ id: "archive", label: "Archived" });
  }
  if (filters.status !== "all") {
    chips.push({ id: "status", label: `Status: ${filters.status}` });
  }
  if (filters.customerName !== "all") {
    chips.push({ id: "customer", label: `Customer: ${filters.customerName}` });
  }
  if (filters.datePreset !== "all") {
    const labels: Record<DatePresetId, string> = {
      today: "Today",
      "last-7": "Last 7 Days",
      "last-30": "Last 30 Days",
      "this-month": "This Month",
    };
    chips.push({
      id: "datePreset",
      label: `Quote Date: ${labels[filters.datePreset]}`,
    });
  }
  if (filters.expiringSoon) {
    chips.push({ id: "expiringSoon", label: "Expiring Soon" });
  }
  if (filters.attention === "drafts-stale") {
    chips.push({ id: "attention", label: "Stale drafts" });
  }
  if (filters.attention === "awaiting-response") {
    chips.push({ id: "attention", label: "Awaiting response" });
  }
  if (filters.search.trim()) {
    chips.push({ id: "search", label: `Search: “${filters.search.trim()}”` });
  }

  return chips;
}

export function clearQuoteFilterChip(
  filters: QuoteFilters,
  chipId: string,
): QuoteFilters {
  switch (chipId) {
    case "archive":
      return { ...filters, archive: "active" };
    case "status":
      return { ...filters, status: "all" };
    case "customer":
      return { ...filters, customerName: "all" };
    case "datePreset":
      return { ...filters, datePreset: "all" };
    case "expiringSoon":
      return { ...filters, expiringSoon: false };
    case "attention":
      return { ...filters, attention: null };
    case "search":
      return { ...filters, search: "" };
    default:
      return filters;
  }
}
