/**
 * Build a safe download filename:
 * {CompanySlug}_Quote_{QuoteId}_{YYYY-MM-DD}[_DRAFT].pdf
 */
export function buildQuotePdfFileName(input: {
  companyName: string;
  quoteId: string;
  quoteDate: string | null | undefined;
  fallbackDate: string;
  draft: boolean;
}): string {
  const date =
    sanitizeDate(input.quoteDate) ||
    sanitizeDate(input.fallbackDate) ||
    "unknown-date";
  const company = slugify(input.companyName) || "Company";
  const quoteId = slugify(input.quoteId) || "Quote";
  const draftSuffix = input.draft ? "_DRAFT" : "";
  const raw = `${company}_Quote_${quoteId}_${date}${draftSuffix}.pdf`;
  return clampFileName(raw, 120);
}

function sanitizeDate(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return "";
}

function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function clampFileName(name: string, max: number): string {
  if (name.length <= max) return name;
  const ext = ".pdf";
  const draft = name.endsWith("_DRAFT.pdf");
  const suffix = draft ? "_DRAFT.pdf" : ext;
  const bodyMax = max - suffix.length;
  const withoutExt = name.slice(0, name.length - (draft ? "_DRAFT.pdf".length : 4));
  return `${withoutExt.slice(0, Math.max(1, bodyMax))}${suffix}`;
}
