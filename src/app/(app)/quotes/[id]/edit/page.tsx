import { QuoteBuilderView } from "@/components/quotes/builder/quote-builder-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Quote",
};

type EditQuotePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditQuotePage({ params }: EditQuotePageProps) {
  const { id } = await params;
  return <QuoteBuilderView mode="edit" quoteId={id} />;
}
