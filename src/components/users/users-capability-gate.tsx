"use client";

import { RequireCapability } from "@/components/auth/require-auth";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import type { ReactNode } from "react";

export function UsersCapabilityGate({ children }: { children: ReactNode }) {
  const { capabilities } = useDemoAuthSession();
  return (
    <RequireCapability allowed={capabilities.canManageUsers}>
      {children}
    </RequireCapability>
  );
}
