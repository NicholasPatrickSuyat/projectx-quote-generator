import type { LogoJson } from "@/lib/db/schema/company";
import { centsToDollars, dollarsToCents } from "@/lib/money";
import type { CatalogItem } from "@/types/catalog";
import type { CompanyLogo, CompanySettings } from "@/types/company";
import type { Customer, CustomerFormValues } from "@/types/customer";
import type {
  DiscountType,
  LineCategory,
  Quote,
  QuoteCustomerSnapshot,
  QuoteLineItem,
  QuotePdfSnapshot,
  QuoteStatus,
} from "@/types/quote";
import type {
  catalogItems,
  companySettings,
  customers,
  quoteLineItems,
  quotes,
} from "@/lib/db/schema";

type SettingsRow = typeof companySettings.$inferSelect;
type CatalogRow = typeof catalogItems.$inferSelect;
type CustomerRow = typeof customers.$inferSelect;
type QuoteRow = typeof quotes.$inferSelect;
type QuoteLineRow = typeof quoteLineItems.$inferSelect;

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

/** Aggregates are zeroed — filled by QuoteSession / client-side derivation. */
export function customerRowToDomain(row: CustomerRow): Customer {
  return {
    id: row.id,
    customerNumber: row.customerNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    companyName: row.companyName ?? "",
    street: row.street,
    city: row.city,
    state: row.state,
    zip: row.zip,
    internalNotes: row.internalNotes,
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    archived: row.archived,
    totalQuotes: 0,
    draftQuotes: 0,
    acceptedQuotes: 0,
    lastQuoteDate: null,
    recentQuotes: [],
  };
}

export function toCustomerInsert(
  values: CustomerFormValues,
  companyId: string,
  customerNumber: string,
  id: string,
  now: Date,
) {
  return {
    id,
    companyId,
    customerNumber,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    companyName: values.companyName.trim() || null,
    phone: values.phone.trim(),
    email: values.email.trim(),
    street: values.street.trim(),
    city: values.city.trim(),
    state: values.state.trim(),
    zip: values.zip.trim(),
    internalNotes: values.internalNotes.trim(),
    archived: false,
    archivedAt: null as Date | null,
    createdAt: now,
    updatedAt: now,
  };
}

function lifecycleToIso(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString();
}

export function lineRowToDomain(row: QuoteLineRow): QuoteLineItem {
  return {
    id: row.id,
    category: row.category as LineCategory,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: centsToDollars(row.unitPriceCents),
    unit: row.unit,
    internalNotes: row.internalNotes,
    sortOrder: row.sortOrder,
    lineTotal: centsToDollars(row.lineTotalCents),
  };
}

export function quoteRowToDomain(
  row: QuoteRow,
  lines: QuoteLineRow[],
): Quote {
  const sorted = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    id: row.id,
    quoteNumber: row.quoteNumber,
    customerSnapshot: row.customerSnapshot as QuoteCustomerSnapshot,
    jobDescription: row.jobDescription,
    status: row.status as QuoteStatus,
    quoteDate: row.quoteDate,
    validUntil: row.validUntil,
    preparedBy: row.preparedBy,
    preparedByUserId: row.preparedByUserId,
    internalNotes: row.internalNotes,
    customerFacingMessage: row.customerFacingMessage,
    termsAndConditions: row.termsAndConditions,
    taxRate: Number(row.taxRate),
    discountType: row.discountType as DiscountType,
    discountValue: Number(row.discountValue),
    lineItems: sorted.map(lineRowToDomain),
    subtotal: centsToDollars(row.subtotalCents),
    discountAmount: centsToDollars(row.discountCents),
    taxAmount: centsToDollars(row.taxCents),
    grandTotal: centsToDollars(row.grandTotalCents),
    createdAt: row.createdAt.toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    sentAt: lifecycleToIso(row.sentAt),
    acceptedAt: lifecycleToIso(row.acceptedAt),
    rejectedAt: lifecycleToIso(row.rejectedAt),
    expiredAt: lifecycleToIso(row.expiredAt),
    archivedAt: lifecycleToIso(row.archivedAt),
    archived: row.archived,
    statusBeforeArchive: (row.statusBeforeArchive as QuoteStatus | null) ?? null,
    pdfSnapshot: (row.pdfSnapshot as QuotePdfSnapshot | null) ?? null,
  };
}

/** Parse domain ISO date or full timestamptz string into a Date for DB columns. */
export function domainTimestampToDate(
  value: string | null | undefined,
): Date | null {
  if (!value) return null;
  const parsed = new Date(
    value.includes("T") ? value : `${value}T12:00:00.000Z`,
  );
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toQuoteLineInsert(
  line: QuoteLineItem,
  companyId: string,
  quoteId: string,
  now: Date,
) {
  return {
    id: line.id,
    companyId,
    quoteId,
    category: line.category,
    description: line.description,
    quantity: String(line.quantity),
    unit: line.unit,
    unitPriceCents: dollarsToCents(line.unitPrice),
    lineTotalCents: dollarsToCents(line.lineTotal),
    internalNotes: line.internalNotes,
    sortOrder: line.sortOrder,
    createdAt: now,
    updatedAt: now,
  };
}

/** Insert values for CREATE — always Draft with cleared lifecycle/freeze. */
export function toQuoteInsertForCreate(
  quote: Quote,
  companyId: string,
  customerId: string,
  quoteNumber: string,
  now: Date,
) {
  return {
    id: quote.id,
    companyId,
    quoteNumber,
    customerId,
    customerSnapshot: quote.customerSnapshot!,
    jobDescription: quote.jobDescription,
    status: "Draft" as const,
    quoteDate: quote.quoteDate,
    validUntil: quote.validUntil,
    preparedByUserId: quote.preparedByUserId,
    preparedBy: quote.preparedBy,
    internalNotes: quote.internalNotes,
    customerFacingMessage: quote.customerFacingMessage,
    termsAndConditions: quote.termsAndConditions,
    subtotalCents: dollarsToCents(quote.subtotal),
    discountType: quote.discountType,
    discountValue: String(quote.discountValue),
    discountCents: dollarsToCents(quote.discountAmount),
    taxRate: String(quote.taxRate),
    taxCents: dollarsToCents(quote.taxAmount),
    grandTotalCents: dollarsToCents(quote.grandTotal),
    sentAt: null,
    acceptedAt: null,
    rejectedAt: null,
    expiredAt: null,
    archived: false,
    archivedAt: null,
    statusBeforeArchive: null,
    pdfSnapshot: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** @deprecated Prefer toQuoteInsertForCreate / toQuoteBusinessUpdateSet / toQuoteLifecycleUpdateSet */
export function toQuoteInsert(
  quote: Quote,
  companyId: string,
  customerId: string,
  quoteNumber: string,
  now: Date,
) {
  return toQuoteInsertForCreate(quote, companyId, customerId, quoteNumber, now);
}

/** Business-field update only — never writes lifecycle / freeze from the client. */
export function toQuoteBusinessUpdateSet(quote: Quote, now: Date) {
  return {
    customerId: quote.customerSnapshot!.customerId,
    customerSnapshot: quote.customerSnapshot!,
    jobDescription: quote.jobDescription,
    quoteDate: quote.quoteDate,
    validUntil: quote.validUntil,
    preparedByUserId: quote.preparedByUserId,
    preparedBy: quote.preparedBy,
    internalNotes: quote.internalNotes,
    customerFacingMessage: quote.customerFacingMessage,
    termsAndConditions: quote.termsAndConditions,
    subtotalCents: dollarsToCents(quote.subtotal),
    discountType: quote.discountType,
    discountValue: String(quote.discountValue),
    discountCents: dollarsToCents(quote.discountAmount),
    taxRate: String(quote.taxRate),
    taxCents: dollarsToCents(quote.taxAmount),
    grandTotalCents: dollarsToCents(quote.grandTotal),
    updatedAt: now,
  };
}

/** Full lifecycle persist for dedicated status actions only. */
export function toQuoteLifecycleUpdateSet(quote: Quote, now: Date) {
  return {
    ...toQuoteBusinessUpdateSet(quote, now),
    status: quote.status,
    sentAt: domainTimestampToDate(quote.sentAt),
    acceptedAt: domainTimestampToDate(quote.acceptedAt),
    rejectedAt: domainTimestampToDate(quote.rejectedAt),
    expiredAt: domainTimestampToDate(quote.expiredAt),
    archived: quote.archived,
    archivedAt: domainTimestampToDate(quote.archivedAt),
    statusBeforeArchive: quote.statusBeforeArchive,
    pdfSnapshot: quote.pdfSnapshot,
  };
}

export function toQuoteUpdateSet(quote: Quote, now: Date) {
  return toQuoteLifecycleUpdateSet(quote, now);
}
