import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Settings",
};

export default function SettingsPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Company Settings"
        description="Company profile, quote defaults, and PDF defaults. Settings forms will arrive in a later milestone."
      />
      <PlaceholderPanel
        title="Company Settings coming soon"
        description="This is an empty shell placeholder. Settings tabs and logo upload are not implemented yet."
      />
    </PageContainer>
  );
}
