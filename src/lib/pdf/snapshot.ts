import { dollarsToCents } from "@/lib/money";
import { stripEmptyLines } from "@/lib/quotes/validation";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import type { CompanyLogo, CompanySettings } from "@/types/company";
import type {
  Quote,
  QuoteCustomerSnapshot,
  QuoteLineItem,
  QuotePdfSnapshot,
} from "@/types/quote";

function cloneLogo(logo: CompanyLogo): CompanyLogo {
  if (!logo) return null;
  return {
    dataUrl: logo.dataUrl,
    fileName: logo.fileName,
    mimeType: logo.mimeType,
    byteLength: logo.byteLength,
  };
}

function cloneCustomer(
  snapshot: QuoteCustomerSnapshot,
): QuoteCustomerSnapshot {
  return { ...snapshot };
}

function cloneLineItems(items: QuoteLineItem[]): QuoteLineItem[] {
  return items.map((item) => ({ ...item }));
}

/**
 * Build a complete frozen PDF snapshot from a validated quote + saved settings.
 * Caller must ensure customer snapshot exists and lines are sanitized.
 */
export function createQuotePdfSnapshot(
  quote: Quote,
  settings: CompanySettings,
  frozenAt: string,
): QuotePdfSnapshot {
  if (!quote.customerSnapshot?.customerId) {
    throw new Error("Cannot freeze a PDF snapshot without a customer.");
  }

  const sanitized = withRecalculatedTotals({
    ...quote,
    lineItems: stripEmptyLines(quote.lineItems),
  });

  return {
    frozenAt,
    company: {
      companyName: settings.companyName,
      logo: cloneLogo(settings.logo),
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      street: settings.street,
      city: settings.city,
      state: settings.state,
      zip: settings.zip,
      currency: settings.currency,
      pdfFooterText: settings.pdfFooterText,
    },
    quote: {
      quoteId: sanitized.quoteNumber,
      quoteDate: sanitized.quoteDate,
      validUntil: sanitized.validUntil,
      preparedBy: sanitized.preparedBy,
      jobDescription: sanitized.jobDescription,
      customerFacingMessage: sanitized.customerFacingMessage,
      termsAndConditions: sanitized.termsAndConditions,
      customerSnapshot: cloneCustomer(sanitized.customerSnapshot!),
      lineItems: cloneLineItems(sanitized.lineItems),
      subtotalCents: dollarsToCents(sanitized.subtotal),
      discountType: sanitized.discountType,
      discountValue: sanitized.discountValue,
      discountAmountCents: dollarsToCents(sanitized.discountAmount),
      taxRate: sanitized.taxRate,
      taxAmountCents: dollarsToCents(sanitized.taxAmount),
      grandTotalCents: dollarsToCents(sanitized.grandTotal),
    },
  };
}

export function clearQuotePdfSnapshot<T extends { pdfSnapshot: QuotePdfSnapshot | null }>(
  quote: T,
): T {
  return { ...quote, pdfSnapshot: null };
}

/** Whether Final PDF should be generated from the frozen snapshot. */
export function quoteUsesFrozenPdf(quote: Quote): boolean {
  return Boolean(quote.pdfSnapshot);
}
