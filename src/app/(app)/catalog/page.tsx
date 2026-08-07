import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Catalog",
};

export default function CatalogPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Service Catalog"
        description="Reusable service templates for the Quote Builder. Catalog management will arrive in a later milestone."
      />
      <PlaceholderPanel
        title="Service Catalog coming soon"
        description="This is an empty shell placeholder. Catalog items and admin tools are not implemented yet."
      />
    </PageContainer>
  );
}
