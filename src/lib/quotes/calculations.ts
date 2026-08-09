import {
  addCents,
  centsToDollars,
  dollarsToCents,
  percentOfCents,
  roundMoney,
} from "@/lib/money";
import type { DiscountType, QuoteLineItem } from "@/types/quote";

export type QuoteTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
};

export function lineTotalCents(quantity: number, unitPrice: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return 0;
  if (quantity <= 0 || unitPrice < 0) return 0;
  return Math.round(quantity * dollarsToCents(unitPrice) + Number.EPSILON);
}

export function computeLineTotal(quantity: number, unitPrice: number): number {
  return centsToDollars(lineTotalCents(quantity, unitPrice));
}

export function computeQuoteTotals(
  lineItems: Pick<QuoteLineItem, "quantity" | "unitPrice">[],
  discountType: DiscountType,
  discountValue: number,
  taxRate: number,
): QuoteTotals {
  const subtotalCents = lineItems.reduce(
    (sum, line) => sum + lineTotalCents(line.quantity, line.unitPrice),
    0,
  );

  let discountCents = 0;
  const safeDiscountValue = Number.isFinite(discountValue) ? discountValue : 0;
  const safeTaxRate = Number.isFinite(taxRate) ? Math.max(0, taxRate) : 0;

  if (discountType === "fixed") {
    discountCents = Math.min(
      subtotalCents,
      Math.max(0, dollarsToCents(safeDiscountValue)),
    );
  } else if (discountType === "percent") {
    const pct = Math.max(0, safeDiscountValue);
    discountCents = Math.min(subtotalCents, percentOfCents(subtotalCents, pct));
  }

  const taxableCents = Math.max(0, subtotalCents - discountCents);
  const taxCents = percentOfCents(taxableCents, safeTaxRate);
  const grandCents = addCents(taxableCents, taxCents);

  return {
    subtotal: centsToDollars(subtotalCents),
    discountAmount: centsToDollars(discountCents),
    taxAmount: centsToDollars(taxCents),
    grandTotal: centsToDollars(grandCents),
  };
}

export function withRecalculatedTotals<
  T extends {
    lineItems: QuoteLineItem[];
    discountType: DiscountType;
    discountValue: number;
    taxRate: number;
  },
>(quote: T): T & QuoteTotals {
  const lines = quote.lineItems.map((line, index) => ({
    ...line,
    lineTotal: computeLineTotal(line.quantity, line.unitPrice),
    sortOrder: index,
  }));
  const totals = computeQuoteTotals(
    lines,
    quote.discountType,
    quote.discountValue,
    quote.taxRate,
  );
  return {
    ...quote,
    lineItems: lines,
    ...totals,
  };
}

export { roundMoney };
