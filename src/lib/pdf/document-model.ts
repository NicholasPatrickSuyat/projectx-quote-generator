import { centsToDollars } from "@/lib/money";
import { stripEmptyLines } from "@/lib/quotes/validation";
import { formatCompanyCityState } from "@/types/company";
import type { CompanyLogo, CompanySettings } from "@/types/company";
import type {
  DiscountType,
  LineCategory,
  Quote,
  QuoteCustomerSnapshot,
  QuoteLineItem,
  QuotePdfSnapshot,
} from "@/types/quote";
import { LINE_CATEGORIES } from "@/types/quote";

export type QuotePdfMode = "preview" | "final";

export type QuotePdfLineRow = {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
};

export type QuotePdfCategorySection = {
  category: LineCategory;
  rows: QuotePdfLineRow[];
};

export type QuotePdfDocumentModel = {
  mode: QuotePdfMode;
  showDraftWatermark: boolean;
  company: {
    companyName: string;
    logoDataUrl: string | null;
    phone: string;
    email: string;
    website: string;
    addressLine: string;
    cityStateZip: string;
    pdfFooterText: string;
  };
  quote: {
    quoteId: string;
    quoteDate: string;
    validUntil: string | null;
    preparedBy: string;
    jobDescription: string;
    customerFacingMessage: string;
    termsAndConditions: string;
  };
  customer: {
    customerName: string;
    companyName: string;
    phone: string;
    email: string;
    addressLine: string;
    cityStateZip: string;
  };
  sections: QuotePdfCategorySection[];
  showUnitColumn: boolean;
  totals: {
    subtotal: number;
    showDiscount: boolean;
    discountLabel: string;
    discountAmount: number;
    taxRate: number;
    taxAmount: number;
    grandTotal: number;
    currency: "USD";
  };
  fileName: string;
  logoWarning: string | null;
};

function isRenderableLogo(logo: CompanyLogo): logo is NonNullable<CompanyLogo> {
  return Boolean(
    logo &&
      typeof logo.dataUrl === "string" &&
      logo.dataUrl.startsWith("data:image/") &&
      logo.byteLength > 0,
  );
}

function formatAddressLine(street: string): string {
  return street.trim();
}

function formatCityStateZip(city: string, state: string, zip: string): string {
  const cityState = formatCompanyCityState(city, state);
  const z = zip.trim();
  if (cityState && z) return `${cityState} ${z}`;
  if (cityState) return cityState;
  return z;
}

function mapCustomer(snapshot: QuoteCustomerSnapshot) {
  return {
    customerName: snapshot.customerName,
    companyName: snapshot.companyName.trim(),
    phone: snapshot.phone,
    email: snapshot.email,
    addressLine: formatAddressLine(snapshot.street),
    cityStateZip: formatCityStateZip(
      snapshot.city,
      snapshot.state,
      snapshot.zip,
    ),
  };
}

function mapSections(lineItems: QuoteLineItem[]): {
  sections: QuotePdfCategorySection[];
  showUnitColumn: boolean;
} {
  const showUnitColumn = lineItems.some((line) => line.unit.trim().length > 0);
  const sections: QuotePdfCategorySection[] = [];

  for (const category of LINE_CATEGORIES) {
    const rows = lineItems
      .filter((line) => line.category === category)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((line) => ({
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unit: line.unit.trim(),
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
      }));
    if (rows.length > 0) {
      sections.push({ category, rows });
    }
  }

  return { sections, showUnitColumn };
}

function discountLabel(type: DiscountType, value: number): string {
  if (type === "percent") {
    return `Discount (${value}%)`;
  }
  if (type === "fixed") {
    return "Discount";
  }
  return "Discount";
}

function emptyCustomer(): QuotePdfDocumentModel["customer"] {
  return {
    customerName: "—",
    companyName: "",
    phone: "",
    email: "",
    addressLine: "",
    cityStateZip: "",
  };
}

export function buildPreviewPdfModel(
  quote: Quote,
  settings: CompanySettings,
  fileName: string,
): QuotePdfDocumentModel {
  // Same scratch-row rules as Final/snapshot — does not mutate Builder form state.
  const lineItems = stripEmptyLines(quote.lineItems);
  const { sections, showUnitColumn } = mapSections(lineItems);
  const logoOk = isRenderableLogo(settings.logo);

  return {
    mode: "preview",
    showDraftWatermark: true,
    company: {
      companyName: settings.companyName,
      logoDataUrl: logoOk ? settings.logo!.dataUrl : null,
      phone: settings.phone,
      email: settings.email,
      website: settings.website,
      addressLine: formatAddressLine(settings.street),
      cityStateZip: formatCityStateZip(
        settings.city,
        settings.state,
        settings.zip,
      ),
      pdfFooterText: settings.pdfFooterText,
    },
    quote: {
      quoteId: quote.quoteNumber,
      quoteDate: quote.quoteDate,
      validUntil: quote.validUntil,
      preparedBy: quote.preparedBy,
      jobDescription: quote.jobDescription,
      customerFacingMessage: quote.customerFacingMessage,
      termsAndConditions: quote.termsAndConditions,
    },
    customer: quote.customerSnapshot
      ? mapCustomer(quote.customerSnapshot)
      : emptyCustomer(),
    sections,
    showUnitColumn,
    totals: {
      subtotal: quote.subtotal,
      showDiscount: quote.discountType !== "none",
      discountLabel: discountLabel(quote.discountType, quote.discountValue),
      discountAmount: quote.discountAmount,
      taxRate: quote.taxRate,
      taxAmount: quote.taxAmount,
      grandTotal: quote.grandTotal,
      currency: settings.currency,
    },
    fileName,
    logoWarning: logoOk
      ? null
      : settings.logo
        ? "Company logo could not be included in the PDF. The PDF uses text branding instead."
        : null,
  };
}

export function buildFinalPdfModel(
  snapshot: QuotePdfSnapshot,
  fileName: string,
): QuotePdfDocumentModel {
  const q = snapshot.quote;
  const c = snapshot.company;
  const { sections, showUnitColumn } = mapSections(q.lineItems);
  const logoOk = isRenderableLogo(c.logo);

  return {
    mode: "final",
    showDraftWatermark: false,
    company: {
      companyName: c.companyName,
      logoDataUrl: logoOk ? c.logo!.dataUrl : null,
      phone: c.phone,
      email: c.email,
      website: c.website,
      addressLine: formatAddressLine(c.street),
      cityStateZip: formatCityStateZip(c.city, c.state, c.zip),
      pdfFooterText: c.pdfFooterText,
    },
    quote: {
      quoteId: q.quoteId,
      quoteDate: q.quoteDate,
      validUntil: q.validUntil,
      preparedBy: q.preparedBy,
      jobDescription: q.jobDescription,
      customerFacingMessage: q.customerFacingMessage,
      termsAndConditions: q.termsAndConditions,
    },
    customer: mapCustomer(q.customerSnapshot),
    sections,
    showUnitColumn,
    totals: {
      subtotal: centsToDollars(q.subtotalCents),
      showDiscount: q.discountType !== "none",
      discountLabel: discountLabel(q.discountType, q.discountValue),
      discountAmount: centsToDollars(q.discountAmountCents),
      taxRate: q.taxRate,
      taxAmount: centsToDollars(q.taxAmountCents),
      grandTotal: centsToDollars(q.grandTotalCents),
      currency: c.currency,
    },
    fileName,
    logoWarning: logoOk
      ? null
      : c.logo
        ? "Company logo could not be included in the PDF. The PDF uses text branding instead."
        : null,
  };
}
