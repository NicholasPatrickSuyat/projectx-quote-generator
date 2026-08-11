import { markQuoteExpired } from "@/lib/quotes/mutations";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { Quote } from "@/types/quote";

/**
 * M14 auto-expiration (approved Staff lockout fix):
 * - Sent + Valid Until before today → Expired
 * - Draft does NOT auto-expire (may keep a past Valid Until and stay editable)
 * - Accepted / Rejected / Archived unchanged
 * Preserves pdfSnapshot and sentAt via markQuoteExpired.
 */
export function shouldAutoExpire(quote: Quote, todayIso: string): boolean {
  if (quote.archived) return false;
  if (quote.status !== "Sent") return false;
  if (!quote.validUntil) return false;
  return quote.validUntil < todayIso;
}

/**
 * Apply auto-expiration across a quote list.
 * Returns the same array reference when nothing changes (avoids update loops).
 */
export function applyAutoExpirations(quotes: Quote[], today: Date): Quote[] {
  const todayIso = toIsoDate(startOfDay(today));
  let changed = false;

  const next = quotes.map((quote) => {
    if (!shouldAutoExpire(quote, todayIso)) return quote;
    changed = true;
    return markQuoteExpired(quote, today);
  });

  return changed ? next : quotes;
}
