import type {
  CompanyLogo,
  CompanyLogoMimeType,
  CompanySettingsFormValues,
  SettingsFieldKey,
} from "@/types/company";
import { SETTINGS_FIELD_ORDER } from "@/types/company";

/**
 * Max decoded logo bytes for Company Settings.
 *
 * Kept below Next.js default Server Action body limit (1 MiB) after base64
 * data-URL expansion (~4/3) plus the rest of the settings payload.
 * Do not raise casually without also configuring serverActions.bodySizeLimit.
 */
export const LOGO_MAX_BYTES = 512 * 1024;

export function formatLogoMaxLabel(): string {
  if (LOGO_MAX_BYTES % (1024 * 1024) === 0) {
    return `${LOGO_MAX_BYTES / (1024 * 1024)} MB`;
  }
  if (LOGO_MAX_BYTES % 1024 === 0) {
    return `${LOGO_MAX_BYTES / 1024} KB`;
  }
  return `${LOGO_MAX_BYTES} bytes`;
}

export const LOGO_ACCEPT =
  "image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp";

export const PDF_MESSAGE_MAX = 2000;
export const PDF_TERMS_MAX = 2000;
export const PDF_FOOTER_MAX = 500;

/** Aligns with numeric(8,4) and keeps tax rates in a realistic percent range. */
export const TAX_RATE_MAX_PERCENT = 100;
/** Aligns with integer days column; 10-year ceiling is plenty for quote validity. */
export const QUOTE_VALIDITY_DAYS_MAX = 3650;
/** Aligns with numeric(12,4) fixed-amount discount ceiling. */
export const DISCOUNT_VALUE_MAX = 99_999_999.9999;

const ALLOWED_LOGO_MIME = new Set<string>([
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export type CompanySettingsFieldErrors = Partial<
  Record<keyof CompanySettingsFormValues | "logo", string>
>;

export function validateCompanySettingsForm(
  values: CompanySettingsFormValues,
): CompanySettingsFieldErrors {
  const errors: CompanySettingsFieldErrors = {};

  if (!values.companyName.trim()) {
    errors.companyName = "Company name is required.";
  }
  if (!values.phone.trim()) {
    errors.phone = "Phone number is required.";
  } else if (!isValidPhone(values.phone)) {
    errors.phone = "Enter a valid phone number.";
  }
  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(values.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (values.website.trim() && !isValidWebsite(values.website)) {
    errors.website =
      "Enter a valid website URL (for example https://example.com).";
  }
  if (!values.street.trim()) {
    errors.street = "Street address is required.";
  }
  if (!values.city.trim()) {
    errors.city = "City is required.";
  }
  if (!values.state.trim()) {
    errors.state = "State is required.";
  }
  if (!values.zip.trim()) {
    errors.zip = "ZIP code is required.";
  } else if (!/^\d{5}$/.test(values.zip.trim())) {
    errors.zip = "Enter a 5-digit US ZIP code.";
  }

  if (values.currency !== "USD") {
    errors.currency = "Currency must be USD in Version 1.";
  }

  if (!Number.isFinite(values.taxRate) || values.taxRate < 0) {
    errors.taxRate = "Tax rate cannot be negative.";
  } else if (values.taxRate > TAX_RATE_MAX_PERCENT) {
    errors.taxRate = `Tax rate cannot exceed ${TAX_RATE_MAX_PERCENT}%.`;
  }

  if (
    !Number.isFinite(values.quoteValidityDays) ||
    !Number.isInteger(values.quoteValidityDays) ||
    values.quoteValidityDays < 1
  ) {
    errors.quoteValidityDays =
      "Validity period must be a whole number of at least 1 day.";
  } else if (values.quoteValidityDays > QUOTE_VALIDITY_DAYS_MAX) {
    errors.quoteValidityDays = `Validity period cannot exceed ${QUOTE_VALIDITY_DAYS_MAX.toLocaleString()} days.`;
  }

  if (!Number.isFinite(values.discountValue) || values.discountValue < 0) {
    errors.discountValue = "Discount value cannot be negative.";
  } else if (
    values.discountType === "percent" &&
    values.discountValue > 100
  ) {
    errors.discountValue = "Percent discount cannot exceed 100.";
  } else if (
    values.discountType !== "percent" &&
    values.discountValue > DISCOUNT_VALUE_MAX
  ) {
    errors.discountValue = `Discount value cannot exceed ${DISCOUNT_VALUE_MAX.toLocaleString()}.`;
  }

  if (values.customerFacingMessage.length > PDF_MESSAGE_MAX) {
    errors.customerFacingMessage = `Customer-facing message cannot exceed ${PDF_MESSAGE_MAX.toLocaleString()} characters.`;
  }
  if (values.termsAndConditions.length > PDF_TERMS_MAX) {
    errors.termsAndConditions = `Terms and conditions cannot exceed ${PDF_TERMS_MAX.toLocaleString()} characters.`;
  }
  if (values.pdfFooterText.length > PDF_FOOTER_MAX) {
    errors.pdfFooterText = `PDF footer text cannot exceed ${PDF_FOOTER_MAX.toLocaleString()} characters.`;
  }

  if (values.logo) {
    const logoError = validateLogoMeta(values.logo);
    if (logoError) errors.logo = logoError;
  }

  return errors;
}

export function firstSettingsFieldError(
  errors: CompanySettingsFieldErrors,
): SettingsFieldKey | null {
  for (const key of SETTINGS_FIELD_ORDER) {
    if (errors[key]) return key;
  }
  return null;
}

export function validateLogoFile(file: File): string | null {
  const mime = normalizeLogoMime(file.type, file.name);
  if (!mime) {
    return "Logo must be a PNG, JPG, JPEG, or WebP image.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return `Logo must be ${formatLogoMaxLabel()} or smaller.`;
  }
  return null;
}

export function normalizeLogoMime(
  mimeType: string,
  fileName: string,
): CompanyLogoMimeType | null {
  const lower = mimeType.toLowerCase();
  if (ALLOWED_LOGO_MIME.has(lower)) {
    return lower as CompanyLogoMimeType;
  }
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return null;
}

function validateLogoMeta(logo: NonNullable<CompanyLogo>): string | null {
  if (!ALLOWED_LOGO_MIME.has(logo.mimeType)) {
    return "Logo must be a PNG, JPG, JPEG, or WebP image.";
  }
  if (!logo.dataUrl.startsWith("data:image/")) {
    return "Logo data is invalid. Please upload the image again.";
  }

  const comma = logo.dataUrl.indexOf(",");
  if (comma < 0) {
    return "Logo data is invalid. Please upload the image again.";
  }
  const header = logo.dataUrl.slice(0, comma).toLowerCase();
  const payload = logo.dataUrl.slice(comma + 1);
  if (!header.includes("base64")) {
    return "Logo data is invalid. Please upload the image again.";
  }

  // Approximate decoded size from base64 payload (ignore whitespace).
  const cleaned = payload.replace(/\s/g, "");
  const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
  const decodedBytes = Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
  if (decodedBytes > LOGO_MAX_BYTES || logo.byteLength > LOGO_MAX_BYTES) {
    return `Logo must be ${formatLogoMaxLabel()} or smaller.`;
  }
  // Reject spoofed metadata that under-reports size by a wide margin.
  if (logo.byteLength > 0 && decodedBytes > logo.byteLength * 2 + 1024) {
    return "Logo data is invalid. Please upload the image again.";
  }

  return null;
}

export function companySettingsFormsEqual(
  a: CompanySettingsFormValues,
  b: CompanySettingsFormValues,
): boolean {
  return (
    a.companyName === b.companyName &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.website === b.website &&
    a.street === b.street &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.currency === b.currency &&
    a.taxRate === b.taxRate &&
    a.quoteValidityDays === b.quoteValidityDays &&
    a.discountType === b.discountType &&
    a.discountValue === b.discountValue &&
    a.preparedBy === b.preparedBy &&
    a.customerFacingMessage === b.customerFacingMessage &&
    a.termsAndConditions === b.termsAndConditions &&
    a.pdfFooterText === b.pdfFooterText &&
    logosEqual(a.logo, b.logo)
  );
}

function logosEqual(a: CompanyLogo, b: CompanyLogo): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  // Lightweight identity — avoid scanning multi-megabyte data URLs on every keystroke.
  return (
    a.fileName === b.fileName &&
    a.mimeType === b.mimeType &&
    a.byteLength === b.byteLength
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return false;
  return /^[\d\s().+-]+$/.test(value.trim());
}

function isValidWebsite(value: string): boolean {
  const trimmed = value.trim();
  try {
    const url = new URL(
      trimmed.includes("://") ? trimmed : `https://${trimmed}`,
    );
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return false;
    }
    const host = url.hostname.toLowerCase();
    if (!host) return false;
    if (host === "localhost") return true;
    if (!host.includes(".")) return false;
    if (host.startsWith(".") || host.endsWith(".") || host.includes("..")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
