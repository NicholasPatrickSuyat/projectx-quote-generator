import type { LogoJson } from "@/lib/db/schema/company";
import { centsToDollars, dollarsToCents } from "@/lib/money";
import type { CatalogItem } from "@/types/catalog";
import type { CompanyLogo, CompanySettings } from "@/types/company";
import type { catalogItems, companySettings } from "@/lib/db/schema";

type SettingsRow = typeof companySettings.$inferSelect;
type CatalogRow = typeof catalogItems.$inferSelect;

export function logoJsonToCompanyLogo(
  logo: LogoJson | null | undefined,
): CompanyLogo {
  if (!logo) return null;
  return {
    dataUrl: logo.dataUrl,
    fileName: logo.fileName,
    mimeType: logo.mimeType,
    byteLength: logo.byteLength,
  };
}

export function companyLogoToLogoJson(logo: CompanyLogo): LogoJson | null {
  if (!logo) return null;
  return {
    dataUrl: logo.dataUrl,
    fileName: logo.fileName,
    mimeType: logo.mimeType,
    byteLength: logo.byteLength,
  };
}

export function settingsRowToDomain(row: SettingsRow): CompanySettings {
  return {
    companyName: row.companyName,
    logo: logoJsonToCompanyLogo(row.logoJson),
    phone: row.phone,
    email: row.email,
    website: row.website,
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    currency: "USD",
    taxRate: Number(row.taxRate),
    quoteValidityDays: row.quoteValidityDays,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    preparedBy: row.preparedBy,
    customerFacingMessage: row.customerFacingMessage,
    termsAndConditions: row.termsAndConditions,
    pdfFooterText: row.pdfFooterText,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function catalogRowToDomain(row: CatalogRow): CatalogItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    unitPrice: centsToDollars(row.unitPriceCents),
    description: row.description,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    archived: row.archived,
  };
}

export function dollarsToUnitPriceCents(unitPrice: number): number {
  return dollarsToCents(unitPrice);
}
