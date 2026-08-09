import {
  computeQuoteTotals,
  lineTotalCents,
} from "@/lib/quotes/calculations";
import { dollarsToCents } from "@/lib/money";
import type {
  DiscountType,
  Quote,
  QuoteLineItem,
} from "@/types/quote";

export type QuoteFieldErrors = {
  customer?: string;
  jobDescription?: string;
  quoteDate?: string;
  taxRate?: string;
  discountValue?: string;
  lineItems?: string;
  lines?: Record<
    string,
    { description?: string; quantity?: string; unitPrice?: string }
  >;
};

export function validateLineItem(
  line: Pick<QuoteLineItem, "description" | "quantity" | "unitPrice">,
): { description?: string; quantity?: string; unitPrice?: string } {
  const errors: { description?: string; quantity?: string; unitPrice?: string } =
    {};
  if (!line.description.trim()) {
    errors.description = "Description is required.";
  }
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    errors.quantity = "Quantity must be greater than zero.";
  }
  if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
    errors.unitPrice = "Unit price cannot be negative.";
  }
  return errors;
}

export function isEmptyLine(
  line: Pick<
    QuoteLineItem,
    "description" | "quantity" | "unitPrice" | "unit" | "internalNotes"
  >,
): boolean {
  return (
    !line.description.trim() &&
    !line.unit.trim() &&
    !line.internalNotes.trim() &&
    (!Number.isFinite(line.quantity) ||
      line.quantity === 0 ||
      line.quantity === 1) &&
    (!Number.isFinite(line.unitPrice) || line.unitPrice === 0)
  );
}

/** Remove fully empty scratch rows and reindex sortOrder. */
export function stripEmptyLines(lines: QuoteLineItem[]): QuoteLineItem[] {
  return lines
    .filter((line) => !isEmptyLine(line))
    .map((line, sortOrder) => ({ ...line, sortOrder }));
}

export function discountExceedsSubtotal(
  lineItems: Pick<QuoteLineItem, "quantity" | "unitPrice">[],
  discountType: DiscountType,
  discountValue: number,
): boolean {
  if (discountType === "none") return false;
  if (!Number.isFinite(discountValue) || discountValue < 0) return false;

  const subtotalCents = lineItems.reduce(
    (sum, line) => sum + lineTotalCents(line.quantity, line.unitPrice),
    0,
  );

  if (discountType === "fixed") {
    return dollarsToCents(discountValue) > subtotalCents;
  }

  // Percent discounts above 100% exceed the subtotal.
  return discountValue > 100;
}

export type PersistableQuoteInput = {
  customerId: string | null | undefined;
  jobDescription: string;
  quoteDate: string;
  taxRate: number;
  discountType: DiscountType;
  discountValue: number;
  lineItems: QuoteLineItem[];
};

/** Validate persistable quote content. Callers should pass already-stripped lines. */
export function validateDraftSave(input: PersistableQuoteInput): QuoteFieldErrors {
  const errors: QuoteFieldErrors = {};

  if (!input.customerId) {
    errors.customer = "Select a customer before saving.";
  }
  if (!input.jobDescription.trim()) {
    errors.jobDescription = "Job / service description is required.";
  }
  if (!input.quoteDate) {
    errors.quoteDate = "Quote date is required.";
  }
  if (!Number.isFinite(input.taxRate) || input.taxRate < 0) {
    errors.taxRate = "Tax rate cannot be negative.";
  }

  if (
    discountExceedsSubtotal(
      input.lineItems,
      input.discountType,
      input.discountValue,
    )
  ) {
    errors.discountValue = "Discount cannot exceed subtotal.";
  }

  const totals = computeQuoteTotals(
    input.lineItems,
    input.discountType,
    input.discountValue,
    input.taxRate,
  );
  if (totals.grandTotal < 0) {
    errors.discountValue =
      errors.discountValue ?? "Grand total cannot be negative.";
  }

  const lineErrors: QuoteFieldErrors["lines"] = {};
  for (const line of input.lineItems) {
    const le = validateLineItem(line);
    if (Object.keys(le).length > 0) {
      lineErrors[line.id] = le;
    }
  }
  if (Object.keys(lineErrors).length > 0) {
    errors.lines = lineErrors;
  }

  return errors;
}

export function quoteToPersistInput(quote: Quote): PersistableQuoteInput {
  return {
    customerId: quote.customerSnapshot?.customerId,
    jobDescription: quote.jobDescription,
    quoteDate: quote.quoteDate,
    taxRate: quote.taxRate,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    lineItems: stripEmptyLines(quote.lineItems),
  };
}

export function validateQuoteForPersist(quote: Quote): QuoteFieldErrors {
  return validateDraftSave(quoteToPersistInput(quote));
}

export function canMarkAsSent(
  quote: Quote,
): { ok: true } | { ok: false; reason: string; errors: QuoteFieldErrors } {
  const errors = validateQuoteForPersist(quote);
  const lines = stripEmptyLines(quote.lineItems);

  if (lines.length === 0) {
    errors.lineItems =
      "Add at least one line item before marking as Sent.";
  }

  const totals = computeQuoteTotals(
    lines,
    quote.discountType,
    quote.discountValue,
    quote.taxRate,
  );
  if (totals.grandTotal <= 0) {
    errors.lineItems =
      errors.lineItems ??
      "Grand total must be greater than zero before marking as Sent.";
  }

  if (hasQuoteFieldErrors(errors)) {
    const reason =
      errors.customer ||
      errors.jobDescription ||
      errors.quoteDate ||
      errors.taxRate ||
      errors.discountValue ||
      errors.lineItems ||
      "Fix validation errors before marking as Sent.";
    return { ok: false, reason, errors };
  }

  return { ok: true };
}

export function hasQuoteFieldErrors(errors: QuoteFieldErrors): boolean {
  return Boolean(
    errors.customer ||
      errors.jobDescription ||
      errors.quoteDate ||
      errors.taxRate ||
      errors.discountValue ||
      errors.lineItems ||
      (errors.lines && Object.keys(errors.lines).length > 0),
  );
}

export function firstQuoteFieldError(errors: QuoteFieldErrors): string | null {
  if (errors.customer) return errors.customer;
  if (errors.jobDescription) return errors.jobDescription;
  if (errors.quoteDate) return errors.quoteDate;
  if (errors.taxRate) return errors.taxRate;
  if (errors.discountValue) return errors.discountValue;
  if (errors.lineItems) return errors.lineItems;
  if (errors.lines && Object.keys(errors.lines).length > 0) {
    return "Fix invalid line items before continuing.";
  }
  return null;
}
