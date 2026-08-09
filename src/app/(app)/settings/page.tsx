import { SettingsView } from "@/components/settings/settings-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Company Settings",
};

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-4 py-8 text-sm text-text-secondary sm:px-6">
          Loading settings…
        </div>
      }
    >
      <SettingsView />
    </Suspense>
  );
}
