import { pdf, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { createElement } from "react";
import { QuotePdfDocument } from "@/components/pdf/quote-pdf-document";
import type { QuotePdfDocumentModel } from "@/lib/pdf/document-model";

export async function generateQuotePdfBlob(
  model: QuotePdfDocumentModel,
): Promise<Blob> {
  // react-pdf types pdf() against DocumentProps; QuotePdfDocument returns a Document.
  const element = createElement(QuotePdfDocument, {
    model,
  }) as unknown as ReactElement<DocumentProps>;
  const instance = pdf(element);
  return instance.toBlob();
}
