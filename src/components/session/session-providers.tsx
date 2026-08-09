"use client";

import { CustomerSessionProvider } from "@/components/session/customer-session-provider";
import { QuoteSessionProvider } from "@/components/session/quote-session-provider";
import type { ReactNode } from "react";

export function SessionProviders({ children }: { children: ReactNode }) {
  return (
    <CustomerSessionProvider>
      <QuoteSessionProvider>{children}</QuoteSessionProvider>
    </CustomerSessionProvider>
  );
}
