"use client";

import { getDemoCompanySettings } from "@/lib/company/demo-defaults";
import type {
  CompanyQuoteDefaults,
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";
import { companyQuoteDefaultsFromSettings } from "@/types/company";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** Demo capability boundary — later becomes Admin-only edit. */
export const canManageSettings = true;

type CompanySettingsSessionContextValue = {
  ready: boolean;
  settings: CompanySettings;
  canManageSettings: boolean;
  getQuoteDefaults: () => CompanyQuoteDefaults;
  saveSettings: (values: CompanySettingsFormValues) => CompanySettings;
};

const CompanySettingsSessionContext =
  createContext<CompanySettingsSessionContextValue | null>(null);

let clientNowMs: number | null = null;

function subscribeToNothing() {
  return () => {};
}

function getClientNowMs(): number | null {
  if (clientNowMs === null) {
    clientNowMs = Date.now();
  }
  return clientNowMs;
}

function getServerNowMs(): number | null {
  return null;
}

function useClientNow(): Date | null {
  const ms = useSyncExternalStore(
    subscribeToNothing,
    getClientNowMs,
    getServerNowMs,
  );
  return ms === null ? null : new Date(ms);
}

const EMPTY_SETTINGS = getDemoCompanySettings(new Date(0));

export function CompanySettingsSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const now = useClientNow();
  const [settings, setSettings] = useState<CompanySettings>(EMPTY_SETTINGS);
  const [seeded, setSeeded] = useState(false);

  if (now && !seeded) {
    setSeeded(true);
    setSettings(getDemoCompanySettings(now));
  }

  const value = useMemo<CompanySettingsSessionContextValue>(() => {
    function getQuoteDefaults(): CompanyQuoteDefaults {
      return companyQuoteDefaultsFromSettings(settings);
    }

    function saveSettings(values: CompanySettingsFormValues): CompanySettings {
      const saved: CompanySettings = {
        companyName: values.companyName.trim(),
        logo: values.logo
          ? {
              dataUrl: values.logo.dataUrl,
              fileName: values.logo.fileName,
              mimeType: values.logo.mimeType,
              byteLength: values.logo.byteLength,
            }
          : null,
        phone: values.phone.trim(),
        email: values.email.trim(),
        website: values.website.trim(),
        street: values.street.trim(),
        city: values.city.trim(),
        state: values.state.trim().toUpperCase(),
        zip: values.zip.trim(),
        currency: "USD",
        taxRate: values.taxRate,
        quoteValidityDays: values.quoteValidityDays,
        discountType: values.discountType,
        discountValue: values.discountValue,
        preparedBy: values.preparedBy.trim(),
        customerFacingMessage: values.customerFacingMessage.trim(),
        termsAndConditions: values.termsAndConditions.trim(),
        pdfFooterText: values.pdfFooterText.trim(),
        updatedAt: new Date().toISOString(),
      };
      setSettings(saved);
      return saved;
    }

    return {
      ready: seeded,
      settings,
      canManageSettings,
      getQuoteDefaults,
      saveSettings,
    };
  }, [settings, seeded]);

  return (
    <CompanySettingsSessionContext.Provider value={value}>
      {children}
    </CompanySettingsSessionContext.Provider>
  );
}

export function useCompanySettingsSession(): CompanySettingsSessionContextValue {
  const ctx = useContext(CompanySettingsSessionContext);
  if (!ctx) {
    throw new Error(
      "useCompanySettingsSession must be used within CompanySettingsSessionProvider",
    );
  }
  return ctx;
}
