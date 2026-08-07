import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customers",
};

export default function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Reusable customer records for quoting. List, search, and forms will arrive in a later milestone."
      />
      <PlaceholderPanel
        title="Customers coming soon"
        description="This is an empty shell placeholder. Customer management is not implemented yet."
      />
    </PageContainer>
  );
}
