"use client";

import { CatalogSessionProvider } from "@/components/session/catalog-session-provider";
import { CustomerSessionProvider } from "@/components/session/customer-session-provider";
import { QuoteSessionProvider } from "@/components/session/quote-session-provider";
import type { ReactNode } from "react";

export function SessionProviders({ children }: { children: ReactNode }) {
  return (
    <CustomerSessionProvider>
      <CatalogSessionProvider>
        <QuoteSessionProvider>{children}</QuoteSessionProvider>
      </CatalogSessionProvider>
    </CustomerSessionProvider>
  );
}
