"use client";

import { DemoAuthSessionProvider } from "@/components/session/demo-auth-session-provider";
import { ProductionAuthSessionProvider } from "@/components/session/production-auth-session-provider";
import type { AuthMode } from "@/lib/auth/mode";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";

/**
 * Selects demo vs production auth providers from server-resolved AUTH_MODE.
 * Does not silently fall back — mode is fixed for the process env.
 */
export function AuthRootProvider({
  mode,
  children,
}: {
  mode: AuthMode;
  children: ReactNode;
}) {
  if (mode === "production") {
    return (
      <SessionProvider refetchInterval={30} refetchOnWindowFocus>
        <ProductionAuthSessionProvider>{children}</ProductionAuthSessionProvider>
      </SessionProvider>
    );
  }

  return <DemoAuthSessionProvider>{children}</DemoAuthSessionProvider>;
}
