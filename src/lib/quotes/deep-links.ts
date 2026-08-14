import type { DatePresetId } from "@/lib/dashboard/date-presets";
import {
  DEFAULT_QUOTE_FILTERS,
  isQuoteStatus,
  type QuoteAttentionFilter,
  type QuoteFilters,
} from "@/lib/quotes/filters";
import type { QuoteStatus } from "@/types/quote";

const DATE_PRESETS: DatePresetId[] = [
  "today",
  "last-7",
  "last-30",
  "this-month",
];

function parseAttention(value: string | null): QuoteAttentionFilter {
  if (value === "drafts-stale" || value === "awaiting-response") return value;
  return null;
}

/**
 * Parse approved Quotes deep-link params (+ temporary legacy aliases).
 *
 * Approved: create=1, expiringSoon=1, attention=…, customer=CUST-…, status=…
 * Legacy: action=new, expiring=7, stale=7
 *
 * `customerId` is the business customer number (CUST-…) used for preselect /
 * filter resolution — not the internal UUID. Consumers should resolve via
 * `customerNumber` when the value starts with CUST-.
 */
export function parseQuotesSearchParams(
  params: URLSearchParams,
): {
  filters: QuoteFilters;
  create: boolean;
  /** Business customer number (CUST-…), not UUID. */
  customerId: string | null;
} {
  const filters: QuoteFilters = { ...DEFAULT_QUOTE_FILTERS };

  const status = params.get("status");
  if (status && isQuoteStatus(status)) {
    filters.status = status as QuoteStatus;
  }

  const customerId = params.get("customer");
  // Customer number filter is applied after load via snapshot name; keep number for create/preselect.
  // Also support filtering by exact customer name if passed (rare).
  const customerName = params.get("customerName");
  if (customerName) {
    filters.customerName = customerName;
  }

  const datePreset = params.get("datePreset") ?? params.get("date");
  if (datePreset && (DATE_PRESETS as string[]).includes(datePreset)) {
    filters.datePreset = datePreset as DatePresetId;
  }

  if (
    params.get("expiringSoon") === "1" ||
    params.get("expiringSoon") === "true" ||
    params.get("expiring") === "7"
  ) {
    filters.expiringSoon = true;
  }

  const attention =
    parseAttention(params.get("attention")) ??
    (params.get("stale") === "7" ? "drafts-stale" : null);
  if (attention) {
    filters.attention = attention;
  }

  const create =
    params.get("create") === "1" ||
    params.get("create") === "true" ||
    params.get("action") === "new";

  return {
    filters,
    create,
    customerId: customerId && customerId.startsWith("CUST-") ? customerId : null,
  };
}

/** Strip one-shot create params while preserving filter deep-links. */
export function quotesUrlWithoutCreate(params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  next.delete("create");
  next.delete("action");
  const qs = next.toString();
  return qs ? `/quotes?${qs}` : "/quotes";
}
