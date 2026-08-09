import type { DiscountType } from "@/types/quote";

export type CompanyLogoMimeType = "image/png" | "image/jpeg" | "image/webp";

export type CompanyLogo = {
  dataUrl: string;
  fileName: string;
  mimeType: CompanyLogoMimeType;
  byteLength: number;
} | null;

/** Full company settings session record (single company). */
export type CompanySettings = {
  companyName: string;
  logo: CompanyLogo;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  state: string;
  zip: string;

  currency: "USD";
  taxRate: number;
  quoteValidityDays: number;
  discountType: DiscountType;
  discountValue: number;
  preparedBy: string;

  customerFacingMessage: string;
  termsAndConditions: string;
  pdfFooterText: string;

  /** Full ISO datetime of last successful save. */
  updatedAt: string;
};

/** Editable form values (same shape as settings without requiring updatedAt until save). */
export type CompanySettingsFormValues = Omit<CompanySettings, "updatedAt">;

/** Quote-default slice used when creating / duplicating / reactivating quotes. */
export type CompanyQuoteDefaults = Pick<
  CompanySettings,
  | "currency"
  | "taxRate"
  | "quoteValidityDays"
  | "discountType"
  | "discountValue"
  | "preparedBy"
  | "customerFacingMessage"
  | "termsAndConditions"
>;

export type SettingsTabId = "profile" | "defaults" | "pdf";

export const SETTINGS_TABS: { id: SettingsTabId; label: string }[] = [
  { id: "profile", label: "Company Profile" },
  { id: "defaults", label: "Quote Defaults" },
  { id: "pdf", label: "PDF Defaults" },
];

export function parseSettingsTab(value: string | null): SettingsTabId {
  if (value === "defaults" || value === "pdf" || value === "profile") {
    return value;
  }
  return "profile";
}

/** Logical save/validation order across all settings tabs. */
export const SETTINGS_FIELD_ORDER = [
  "logo",
  "companyName",
  "phone",
  "email",
  "website",
  "street",
  "city",
  "state",
  "zip",
  "currency",
  "taxRate",
  "quoteValidityDays",
  "discountType",
  "discountValue",
  "preparedBy",
  "customerFacingMessage",
  "termsAndConditions",
  "pdfFooterText",
] as const;

export type SettingsFieldKey = (typeof SETTINGS_FIELD_ORDER)[number];

export function tabForSettingsField(field: string): SettingsTabId {
  switch (field) {
    case "currency":
    case "taxRate":
    case "quoteValidityDays":
    case "discountType":
    case "discountValue":
    case "preparedBy":
      return "defaults";
    case "customerFacingMessage":
    case "termsAndConditions":
    case "pdfFooterText":
      return "pdf";
    default:
      return "profile";
  }
}

export function settingsFieldLabel(field: string): string {
  switch (field) {
    case "logo":
      return "Company Logo";
    case "companyName":
      return "Company Name";
    case "phone":
      return "Phone Number";
    case "email":
      return "Email Address";
    case "website":
      return "Website";
    case "street":
      return "Street Address";
    case "city":
      return "City";
    case "state":
      return "State";
    case "zip":
      return "ZIP Code";
    case "currency":
      return "Currency";
    case "taxRate":
      return "Default Tax Rate";
    case "quoteValidityDays":
      return "Default Quote Validity";
    case "discountType":
      return "Default Discount Type";
    case "discountValue":
      return "Default Discount Value";
    case "preparedBy":
      return "Default Prepared By";
    case "customerFacingMessage":
      return "Default Customer-Facing Message";
    case "termsAndConditions":
      return "Default Terms and Conditions";
    case "pdfFooterText":
      return "PDF Footer Text";
    default:
      return field;
  }
}

export function companyQuoteDefaultsFromSettings(
  settings: CompanySettings,
): CompanyQuoteDefaults {
  return {
    currency: settings.currency,
    taxRate: settings.taxRate,
    quoteValidityDays: settings.quoteValidityDays,
    discountType: settings.discountType,
    discountValue: settings.discountValue,
    preparedBy: settings.preparedBy,
    customerFacingMessage: settings.customerFacingMessage,
    termsAndConditions: settings.termsAndConditions,
  };
}

export function formatCompanyCityState(
  city: string,
  state: string,
): string {
  const c = city.trim();
  const s = state.trim();
  if (c && s) return `${c}, ${s}`;
  if (c) return c;
  if (s) return s;
  return "";
}
