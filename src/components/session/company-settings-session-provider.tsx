"use client";

import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import {
  getPersistencePublicInfo,
  loadCompanySettingsFromDb,
  saveCompanySettingsToDb,
} from "@/lib/actions/persistence";
import {
  emptyCompanySettingsForm,
  getDemoCompanySettings,
} from "@/lib/company/demo-defaults";
import type {
  CompanyQuoteDefaults,
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";
import { companyQuoteDefaultsFromSettings } from "@/types/company";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CompanySettingsSessionContextValue = {
  /**
   * True only when settings finished loading successfully and are safe for
   * quotes/PDF/branding consumers. False while loading or after a DB load failure.
   */
  ready: boolean;
  /** True after boot finished (success or failure). */
  bootSettled: boolean;
  persistenceMode: "session" | "database" | null;
  showHybridNotice: boolean;
  settings: CompanySettings;
  /** True when database mode failed to load; UI must not treat settings as durable. */
  loadFailed: boolean;
  canManageSettings: boolean;
  getQuoteDefaults: () => CompanyQuoteDefaults;
  saveSettings: (values: CompanySettingsFormValues) => Promise<CompanySettings>;
  lastError: string | null;
};

const CompanySettingsSessionContext =
  createContext<CompanySettingsSessionContextValue | null>(null);

/** Neutral placeholder — not demo marketing data. Used only while loading / failed DB loads. */
function unloadedSettingsPlaceholder(): CompanySettings {
  return {
    ...emptyCompanySettingsForm(),
    updatedAt: new Date(0).toISOString(),
  };
}

export function CompanySettingsSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { capabilities } = useDemoAuthSession();
  const [settings, setSettings] = useState<CompanySettings>(
    unloadedSettingsPlaceholder(),
  );
  const [ready, setReady] = useState(false);
  const [bootSettled, setBootSettled] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<
    "session" | "database" | null
  >(null);
  const [showHybridNotice, setShowHybridNotice] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const info = await getPersistencePublicInfo();
        if (cancelled) return;
        setPersistenceMode(info.mode);
        setShowHybridNotice(info.showHybridNotice);
        if (info.mode === "database") {
          const loaded = await loadCompanySettingsFromDb();
          if (cancelled) return;
          setSettings(loaded);
          setLoadFailed(false);
          setLastError(null);
          setReady(true);
        } else {
          setSettings(getDemoCompanySettings(new Date()));
          setLoadFailed(false);
          setLastError(null);
          setReady(true);
        }
        setBootSettled(true);
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load settings.";
        setLastError(message);
        setLoadFailed(true);
        setSettings(unloadedSettingsPlaceholder());
        // Keep ready=false so quotes/PDF/branding never consume blank placeholders.
        setReady(false);
        setBootSettled(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CompanySettingsSessionContextValue>(() => {
    const mutationsEnabled =
      ready &&
      persistenceMode !== null &&
      !(persistenceMode === "database" && loadFailed);

    function getQuoteDefaults(): CompanyQuoteDefaults {
      if (!ready || loadFailed) {
        throw new Error(
          "Company settings are not available. Refresh after the database load succeeds.",
        );
      }
      return companyQuoteDefaultsFromSettings(settings);
    }

    async function saveSettings(
      values: CompanySettingsFormValues,
    ): Promise<CompanySettings> {
      if (!capabilities.canManageSettings || !mutationsEnabled) {
        throw new Error(
          loadFailed
            ? "Settings failed to load from the database. Refresh before saving."
            : "Settings are still loading. Wait until persistence is ready before saving.",
        );
      }

      if (persistenceMode === "database") {
        try {
          const saved = await saveCompanySettingsToDb(values);
          setSettings(saved);
          setLastError(null);
          setLoadFailed(false);
          setReady(true);
          return saved;
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to save settings.";
          setLastError(message);
          throw error;
        }
      }

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
      setLastError(null);
      return saved;
    }

    return {
      ready,
      bootSettled,
      persistenceMode,
      showHybridNotice,
      settings,
      loadFailed,
      canManageSettings: capabilities.canManageSettings && mutationsEnabled,
      getQuoteDefaults,
      saveSettings,
      lastError,
    };
  }, [
    settings,
    ready,
    bootSettled,
    loadFailed,
    persistenceMode,
    showHybridNotice,
    lastError,
    capabilities.canManageSettings,
  ]);

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
