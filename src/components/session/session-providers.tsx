"use client";

import { CatalogSessionProvider } from "@/components/session/catalog-session-provider";
import { CompanySettingsSessionProvider } from "@/components/session/company-settings-session-provider";
import { CustomerSessionProvider } from "@/components/session/customer-session-provider";
import { QuoteSessionProvider } from "@/components/session/quote-session-provider";
import type { ReactNode } from "react";

export function SessionProviders({ children }: { children: ReactNode }) {
  return (
    <CompanySettingsSessionProvider>
      <CustomerSessionProvider>
        <CatalogSessionProvider>
          <QuoteSessionProvider>{children}</QuoteSessionProvider>
        </CatalogSessionProvider>
      </CustomerSessionProvider>
    </CompanySettingsSessionProvider>
  );
}
