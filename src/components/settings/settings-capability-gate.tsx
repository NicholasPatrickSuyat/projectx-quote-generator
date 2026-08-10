"use client";

import { RequireCapability } from "@/components/auth/require-auth";
import { SettingsView } from "@/components/settings/settings-view";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";

export function SettingsCapabilityGate() {
  const { capabilities } = useDemoAuthSession();
  return (
    <RequireCapability allowed={capabilities.canManageSettings}>
      <SettingsView />
    </RequireCapability>
  );
}
