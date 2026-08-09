import type {
  CompanyQuoteDefaults,
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";

/**
 * Centralized demo company profile + quote/PDF defaults.
 * Session store seeds from this; refresh resets to seed.
 */

const DEMO_PROFILE = {
  companyName: "Project X Mechanical Services",
  phone: "(214) 555-0190",
  email: "quotes@projectxdemo.com",
  website: "https://www.projectxdemo.com",
  street: "4800 Main Street",
  city: "Dallas",
  state: "TX",
  zip: "75201",
} as const;

const DEMO_QUOTE_DEFAULTS = {
  currency: "USD" as const,
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

const DEMO_PDF_DEFAULTS = {
  pdfFooterText:
    "Project X Mechanical Services · Dallas, TX · quotes@projectxdemo.com",
} as const;

/** Quote-default slice used by historical quote seed fallbacks. */
export const DEMO_COMPANY_DEFAULTS: CompanyQuoteDefaults = {
  ...DEMO_QUOTE_DEFAULTS,
  customerFacingMessage: DEMO_QUOTE_DEFAULTS.customerFacingMessage,
  termsAndConditions: DEMO_QUOTE_DEFAULTS.termsAndConditions,
};

export function emptyCompanySettingsForm(): CompanySettingsFormValues {
  return {
    companyName: "",
    logo: null,
    phone: "",
    email: "",
    website: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    currency: "USD",
    taxRate: 0,
    quoteValidityDays: 30,
    discountType: "none",
    discountValue: 0,
    preparedBy: "",
    customerFacingMessage: "",
    termsAndConditions: "",
    pdfFooterText: "",
  };
}

export function companySettingsToFormValues(
  settings: CompanySettings,
): CompanySettingsFormValues {
  return {
    companyName: settings.companyName,
    logo: settings.logo
      ? {
          dataUrl: settings.logo.dataUrl,
          fileName: settings.logo.fileName,
          mimeType: settings.logo.mimeType,
          byteLength: settings.logo.byteLength,
        }
      : null,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    street: settings.street,
    city: settings.city,
    state: settings.state,
    zip: settings.zip,
    currency: settings.currency,
    taxRate: settings.taxRate,
    quoteValidityDays: settings.quoteValidityDays,
    discountType: settings.discountType,
    discountValue: settings.discountValue,
    preparedBy: settings.preparedBy,
    customerFacingMessage: settings.customerFacingMessage,
    termsAndConditions: settings.termsAndConditions,
    pdfFooterText: settings.pdfFooterText,
  };
}

export function getDemoCompanySettings(now: Date): CompanySettings {
  return {
    ...DEMO_PROFILE,
    logo: null,
    ...DEMO_QUOTE_DEFAULTS,
    customerFacingMessage: DEMO_QUOTE_DEFAULTS.customerFacingMessage,
    termsAndConditions: DEMO_QUOTE_DEFAULTS.termsAndConditions,
    ...DEMO_PDF_DEFAULTS,
    updatedAt: now.toISOString(),
  };
}
