/** Centralized demo company/quote defaults until Company Settings ships. */

export const DEMO_COMPANY_DEFAULTS = {
  currency: "USD",
  taxRate: 0,
  quoteValidityDays: 30,
  discountType: "none" as const,
  discountValue: 0,
  preparedBy: "Alex Rivera",
  customerFacingMessage:
    "Thank you for the opportunity to quote this work. Please review the details below and contact us with any questions.",
  termsAndConditions:
    "This quote is valid until the date shown. Prices are estimates and may change if the scope of work changes. Payment terms to be agreed upon acceptance.",
} as const;
