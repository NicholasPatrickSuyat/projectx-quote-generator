import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quotes",
};

export default function QuotesPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Quotes"
        description="Browse and manage quotes. Filters, tables, and actions will arrive in a later milestone."
      />
      <PlaceholderPanel
        title="Quotes coming soon"
        description="This is an empty shell placeholder. Quote list and workflow features are not implemented yet."
      />
    </PageContainer>
  );
}
