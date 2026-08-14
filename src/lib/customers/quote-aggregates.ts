import type { Customer, CustomerRecentQuote } from "@/types/customer";
import type { Quote } from "@/types/quote";

const RECENT_QUOTE_LIMIT = 5;

export type CustomerQuoteAggregates = {
  totalQuotes: number;
  draftQuotes: number;
  acceptedQuotes: number;
  lastQuoteDate: string | null;
  recentQuotes: CustomerRecentQuote[];
};

function customerIdOf(quote: Quote): string | null {
  const id = quote.customerSnapshot?.customerId?.trim();
  return id ? id : null;
}

/** Non-archived quotes for one customer (QuoteSession is SoT). */
export function quotesForCustomer(
  customerId: string,
  quotes: Quote[],
): Quote[] {
  return quotes.filter(
    (quote) => !quote.archived && customerIdOf(quote) === customerId,
  );
}

export function buildCustomerQuoteAggregates(
  customerId: string,
  quotes: Quote[],
): CustomerQuoteAggregates {
  const owned = quotesForCustomer(customerId, quotes);
  const sorted = [...owned].sort((a, b) => {
    const byDate = b.quoteDate.localeCompare(a.quoteDate);
    if (byDate !== 0) return byDate;
    return b.updatedAt.localeCompare(a.updatedAt);
  });

  const recentQuotes: CustomerRecentQuote[] = sorted
    .slice(0, RECENT_QUOTE_LIMIT)
    .map((quote) => ({
      id: quote.id,
      number: quote.quoteNumber,
      status: quote.status,
      date: quote.quoteDate,
      total: quote.grandTotal,
    }));

  let lastQuoteDate: string | null = null;
  for (const quote of sorted) {
    if (!lastQuoteDate || quote.quoteDate > lastQuoteDate) {
      lastQuoteDate = quote.quoteDate;
    }
  }

  return {
    totalQuotes: owned.length,
    draftQuotes: owned.filter((quote) => quote.status === "Draft").length,
    acceptedQuotes: owned.filter((quote) => quote.status === "Accepted")
      .length,
    lastQuoteDate,
    recentQuotes,
  };
}

function aggregatesEqual(
  a: CustomerQuoteAggregates,
  b: Pick<
    Customer,
    | "totalQuotes"
    | "draftQuotes"
    | "acceptedQuotes"
    | "lastQuoteDate"
    | "recentQuotes"
  >,
): boolean {
  if (
    a.totalQuotes !== b.totalQuotes ||
    a.draftQuotes !== b.draftQuotes ||
    a.acceptedQuotes !== b.acceptedQuotes ||
    a.lastQuoteDate !== b.lastQuoteDate ||
    a.recentQuotes.length !== b.recentQuotes.length
  ) {
    return false;
  }
  return a.recentQuotes.every((row, index) => {
    const other = b.recentQuotes[index];
    return (
      other &&
      row.id === other.id &&
      row.number === other.number &&
      row.status === other.status &&
      row.date === other.date &&
      row.total === other.total
    );
  });
}

/**
 * Write QuoteSession-derived aggregates onto customer records.
 * Returns the same array reference when nothing changed.
 */
export function applyQuoteAggregatesToCustomers(
  customers: Customer[],
  quotes: Quote[],
): Customer[] {
  let changed = false;
  const next = customers.map((customer) => {
    const aggregates = buildCustomerQuoteAggregates(customer.id, quotes);
    if (aggregatesEqual(aggregates, customer)) return customer;
    changed = true;
    return { ...customer, ...aggregates };
  });
  return changed ? next : customers;
}
