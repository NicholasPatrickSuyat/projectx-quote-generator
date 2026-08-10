import { SettingsCapabilityGate } from "@/components/settings/settings-capability-gate";
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
      <SettingsCapabilityGate />
    </Suspense>
  );
}
