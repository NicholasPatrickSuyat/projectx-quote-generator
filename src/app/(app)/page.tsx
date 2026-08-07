import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Operational overview for office quoting. Metrics and widgets will arrive in a later milestone."
      />
      <PlaceholderPanel
        title="Dashboard coming soon"
        description="This is an empty shell placeholder. Business metrics, needs-attention lists, and charts are not implemented yet."
      />
    </PageContainer>
  );
}
