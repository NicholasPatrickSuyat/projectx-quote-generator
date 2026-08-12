import { getDemoCompanySettings } from "@/lib/company/demo-defaults";

/** Neutral bootstrap defaults for empty company_settings (not full demo marketing seed). */
export function getNeutralBootstrapSettingsValues(companyName: string) {
  return {
    companyName,
    logo: null as null,
    phone: "(000) 000-0000",
    email: "office@example.com",
    website: "",
    street: "1 Main Street",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    currency: "USD" as const,
    taxRate: 0,
    quoteValidityDays: 30,
    discountType: "none" as const,
    discountValue: 0,
    preparedBy: "",
    customerFacingMessage:
      "Thank you for the opportunity to quote this work. Please review the details below and contact us with any questions.",
    termsAndConditions:
      "This quote is valid until the date shown. Prices are estimates and may change if the scope of work changes. Payment terms to be agreed upon acceptance.",
    pdfFooterText: `${companyName}`,
  };
}

/** Demo settings branding used only by optional db:seed:demo. */
export function getDemoSeedSettingsSnapshot() {
  return getDemoCompanySettings(new Date());
}
