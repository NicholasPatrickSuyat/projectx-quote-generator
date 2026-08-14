/**
 * Format and allocate business identifiers (CUST-###### / QUO-######).
 * DB allocation uses entity_counters inside a transaction; session mode
 * derives the next number from in-memory records.
 */

export type EntityCounterType = "customer" | "quote";

const CUSTOMER_PREFIX = "CUST-";
const QUOTE_PREFIX = "QUO-";
const DEFAULT_PAD = 6;

export function formatCustomerNumber(value: number, pad = DEFAULT_PAD): string {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Customer number value must be a positive integer.");
  }
  return `${CUSTOMER_PREFIX}${String(value).padStart(pad, "0")}`;
}

export function formatQuoteNumber(value: number, pad = DEFAULT_PAD): string {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error("Quote number value must be a positive integer.");
  }
  return `${QUOTE_PREFIX}${String(value).padStart(pad, "0")}`;
}

export function parseBusinessNumber(
  value: string,
  prefix: typeof CUSTOMER_PREFIX | typeof QUOTE_PREFIX,
): number | null {
  const escaped = prefix.replace("-", "\\-");
  const match = new RegExp(`^${escaped}(\\d+)$`).exec(value.trim());
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isInteger(n) && n >= 1 ? n : null;
}

export function maxBusinessNumber(
  numbers: string[],
  prefix: typeof CUSTOMER_PREFIX | typeof QUOTE_PREFIX,
): number {
  let max = 0;
  for (const raw of numbers) {
    const n = parseBusinessNumber(raw, prefix);
    if (n !== null && n > max) max = n;
  }
  return max;
}

export function nextCustomerNumberFromExisting(numbers: string[]): string {
  return formatCustomerNumber(maxBusinessNumber(numbers, CUSTOMER_PREFIX) + 1);
}

export function nextQuoteNumberFromExisting(numbers: string[]): string {
  const max = maxBusinessNumber(numbers, QUOTE_PREFIX);
  // Preserve historical demo width when numbers are already 4 digits (QUO-1056).
  const sample = numbers.find((n) => parseBusinessNumber(n, QUOTE_PREFIX));
  const pad = sample && sample.length - QUOTE_PREFIX.length === 4 ? 4 : DEFAULT_PAD;
  return formatQuoteNumber(max + 1, pad);
}
