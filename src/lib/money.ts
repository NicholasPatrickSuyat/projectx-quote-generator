/** Integer-cent money helpers with half-up rounding to 2 decimal places. */

export function dollarsToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100 + Number.EPSILON);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

/** Half-up round a dollar amount to 2 decimal places via cents. */
export function roundMoney(value: number): number {
  return centsToDollars(dollarsToCents(value));
}

export function addCents(...parts: number[]): number {
  return parts.reduce((sum, part) => sum + part, 0);
}

export function percentOfCents(cents: number, percent: number): number {
  if (!Number.isFinite(percent) || percent <= 0) return 0;
  // Half-up: (cents * percent) / 100, rounded
  return Math.round((cents * percent) / 100 + Number.EPSILON);
}
