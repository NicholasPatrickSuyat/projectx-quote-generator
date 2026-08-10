import {
  buildFinalPdfModel,
  buildPreviewPdfModel,
  type QuotePdfDocumentModel,
  type QuotePdfMode,
} from "@/lib/pdf/document-model";
import { buildQuotePdfFileName } from "@/lib/pdf/file-name";
import { generateQuotePdfBlob } from "@/lib/pdf/generate-quote-pdf";
import { toIsoDate, startOfDay } from "@/lib/format";
import type { CompanySettings } from "@/types/company";
import type { Quote, QuotePdfSnapshot } from "@/types/quote";

export function resolveQuotePdfMode(quote: Quote): QuotePdfMode {
  if (quote.pdfSnapshot) return "final";
  return "preview";
}

export function buildQuotePdfModel(input: {
  quote: Quote;
  settings: CompanySettings;
  mode: QuotePdfMode;
  today?: Date;
}): QuotePdfDocumentModel {
  const todayIso = toIsoDate(startOfDay(input.today ?? new Date()));

  if (input.mode === "final") {
    const snapshot = input.quote.pdfSnapshot;
    if (!snapshot) {
      throw new Error("Final PDF requires a frozen PDF snapshot.");
    }
    const fileName = buildQuotePdfFileName({
      companyName: snapshot.company.companyName,
      quoteId: snapshot.quote.quoteId,
      quoteDate: snapshot.quote.quoteDate,
      fallbackDate: todayIso,
      draft: false,
    });
    return buildFinalPdfModel(snapshot, fileName);
  }

  const fileName = buildQuotePdfFileName({
    companyName: input.settings.companyName,
    quoteId: input.quote.id,
    quoteDate: input.quote.quoteDate,
    fallbackDate: todayIso,
    draft: true,
  });
  return buildPreviewPdfModel(input.quote, input.settings, fileName);
}

export async function renderQuotePdf(input: {
  quote: Quote;
  settings: CompanySettings;
  mode: QuotePdfMode;
  today?: Date;
}): Promise<{ blob: Blob; model: QuotePdfDocumentModel }> {
  const model = buildQuotePdfModel(input);
  const blob = await generateQuotePdfBlob(model);
  return { blob, model };
}

export async function renderFinalPdfFromSnapshot(
  snapshot: QuotePdfSnapshot,
  today?: Date,
): Promise<{ blob: Blob; model: QuotePdfDocumentModel }> {
  const todayIso = toIsoDate(startOfDay(today ?? new Date()));
  const fileName = buildQuotePdfFileName({
    companyName: snapshot.company.companyName,
    quoteId: snapshot.quote.quoteId,
    quoteDate: snapshot.quote.quoteDate,
    fallbackDate: todayIso,
    draft: false,
  });
  const model = buildFinalPdfModel(snapshot, fileName);
  const blob = await generateQuotePdfBlob(model);
  return { blob, model };
}
