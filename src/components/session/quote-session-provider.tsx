"use client";

import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
import { useCustomerSession } from "@/components/session/customer-session-provider";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { getPersistencePublicInfo } from "@/lib/actions/persistence";
import {
  archiveQuoteInDb,
  createQuoteInDb,
  duplicateQuoteInDb,
  loadQuotesFromDb,
  markQuoteAcceptedInDb,
  markQuoteExpiredInDb,
  markQuoteRejectedInDb,
  markQuoteSentInDb,
  reactivateQuoteInDb,
  restoreQuoteInDb,
  returnQuoteToDraftInDb,
  updateQuoteInDb,
} from "@/lib/actions/quotes";
import { applyAutoExpirations } from "@/lib/quotes/auto-expire";
import { getDemoQuotes } from "@/lib/quotes/demo-data";
import {
  archiveQuote,
  buildNewDraftQuote,
  duplicateQuote,
  markQuoteAccepted,
  markQuoteExpired,
  markQuoteRejected,
  markQuoteSent,
  reactivateQuoteToDraft,
  restoreQuote,
  returnQuoteToDraft,
} from "@/lib/quotes/mutations";
import { preparedByFromSessionUser } from "@/lib/quotes/prepared-by";
import { createQuotePdfSnapshot } from "@/lib/pdf/snapshot";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { Quote, QuoteCustomerSnapshot } from "@/types/quote";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type QuoteSessionContextValue = {
  ready: boolean;
  persistenceMode: "session" | "database" | null;
  showHybridNotice: boolean;
  loadFailed: boolean;
  lastError: string | null;
  clearMutationError: () => void;
  today: Date | null;
  quotes: Quote[];
  getQuote: (id: string) => Quote | undefined;
  upsertQuote: (quote: Quote) => Promise<Quote>;
  createDraft: (
    snapshot: QuoteCustomerSnapshot,
    draft: Quote,
  ) => Promise<Quote>;
  buildDraft: (
    snapshot: QuoteCustomerSnapshot,
    options?: { preparedBy?: string },
  ) => Quote;
  duplicate: (
    id: string,
    options?: { preparedBy?: string },
  ) => Promise<Quote | null>;
  archive: (id: string) => Promise<void>;
  restore: (id: string) => Promise<void>;
  markSent: (id: string) => Promise<void>;
  returnToDraft: (id: string) => Promise<void>;
  markAccepted: (id: string) => Promise<void>;
  markRejected: (id: string) => Promise<void>;
  markExpired: (id: string) => Promise<void>;
  reactivate: (id: string) => Promise<void>;
};

const QuoteSessionContext = createContext<QuoteSessionContextValue | null>(
  null,
);

let clientTodayMs: number | null = null;

function subscribeToNothing() {
  return () => {};
}

function getClientTodayMs(): number | null {
  if (clientTodayMs === null) {
    clientTodayMs = startOfDay(new Date()).getTime();
  }
  return clientTodayMs;
}

function getServerTodayMs(): number | null {
  return null;
}

function useClientToday(): Date | null {
  const ms = useSyncExternalStore(
    subscribeToNothing,
    getClientTodayMs,
    getServerTodayMs,
  );
  return ms === null ? null : new Date(ms);
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function stampUpdatedAt(quote: Quote): Quote {
  return withRecalculatedTotals({
    ...quote,
    updatedAt: toIsoDate(startOfDay(new Date())),
  });
}

export function QuoteSessionProvider({ children }: { children: ReactNode }) {
  const {
    ready: settingsReady,
    bootSettled: settingsBootSettled,
    getQuoteDefaults,
    settings,
  } = useCompanySettingsSession();
  const { applyQuoteAggregates, ready: customersReady } = useCustomerSession();
  const { currentUser, capabilities } = useDemoAuthSession();
  const today = useClientToday();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<
    "session" | "database" | null
  >(null);
  const [showHybridNotice, setShowHybridNotice] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const quotesRef = useRef(quotes);
  const applyQuoteAggregatesRef = useRef(applyQuoteAggregates);
  const bootCompletedRef = useRef(false);

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    applyQuoteAggregatesRef.current = applyQuoteAggregates;
  }, [applyQuoteAggregates]);

  useEffect(() => {
    if (bootCompletedRef.current) return;
    let cancelled = false;

    async function boot() {
      try {
        const info = await getPersistencePublicInfo();
        if (cancelled) return;
        setPersistenceMode(info.mode);
        setShowHybridNotice(info.showHybridNotice);

        if (info.mode === "database") {
          // Load quotes once settings/customers boots settle — do not require
          // settingsReady (Settings load failure must not block quote list /
          // frozen Final PDF regeneration).
          if (!settingsBootSettled || !customersReady) return;
          const loaded = await loadQuotesFromDb();
          if (cancelled) return;
          setQuotes(loaded);
          setLoadFailed(false);
          setLastError(null);
          bootCompletedRef.current = true;
          setReady(true);
          return;
        }

        // Session mode: gate on today (aggregates still wait for customersReady).
        if (!today) return;
        setQuotes(applyAutoExpirations(getDemoQuotes(today), today));
        setLoadFailed(false);
        setLastError(null);
        bootCompletedRef.current = true;
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        setLastError(toErrorMessage(error, "Failed to load quotes."));
        setQuotes([]);
        setLoadFailed(true);
        bootCompletedRef.current = true;
        setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [today, settingsBootSettled, settingsReady, customersReady]);

  // Keep customer aggregates aligned with QuoteSession (including initial boot).
  useEffect(() => {
    if (!ready || !customersReady) return;
    applyQuoteAggregatesRef.current(quotes);
  }, [ready, customersReady, quotes]);

  const value = useMemo<QuoteSessionContextValue>(() => {
    const sessionPreparedBy = preparedByFromSessionUser(currentUser?.fullName);
    const canOverridePreparedBy = capabilities.canOverridePreparedBy;
    const canRestore = capabilities.canRestore;
    const canOverrideQuoteStatus = capabilities.canOverrideQuoteStatus;

    function assertMutationsReady(mode: "session" | "database") {
      if (!ready || persistenceMode === null) {
        throw new Error(
          "Quotes are still loading. Wait until persistence is ready before making changes.",
        );
      }
      if (persistenceMode === "database" && loadFailed) {
        throw new Error(
          "Quotes failed to load from the database. Refresh the page before making changes.",
        );
      }
      if (persistenceMode !== mode) {
        throw new Error(
          `Quote persistence mode mismatch (expected ${mode}, got ${persistenceMode}).`,
        );
      }
    }

    function commitQuotes(next: Quote[]) {
      const expired = today ? applyAutoExpirations(next, today) : next;
      quotesRef.current = expired;
      setQuotes(expired);
      applyQuoteAggregatesRef.current(expired);
      return expired;
    }

    function getQuote(id: string) {
      return quotesRef.current.find((quote) => quote.id === id);
    }

    function normalizePreparedBy(
      incoming: Quote,
      existing: Quote | undefined,
    ): Quote {
      if (canOverridePreparedBy) return incoming;

      if (existing) {
        return { ...incoming, preparedBy: existing.preparedBy };
      }

      return {
        ...incoming,
        preparedBy: sessionPreparedBy ?? incoming.preparedBy,
      };
    }

    /** Block Staff from Admin-only transitions via upsert (Builder persist path). */
    function enforceCapabilities(
      incoming: Quote,
      existing: Quote | undefined,
    ): Quote {
      let next = normalizePreparedBy(incoming, existing);
      if (!existing) return next;

      if (!canRestore && existing.archived && !next.archived) {
        next = {
          ...next,
          archived: true,
          archivedAt: existing.archivedAt,
          status: existing.status,
          statusBeforeArchive: existing.statusBeforeArchive,
        };
      }

      if (!canOverrideQuoteStatus) {
        if (next.status === "Expired" && existing.status !== "Expired") {
          next = {
            ...next,
            status: existing.status,
            expiredAt: existing.expiredAt,
          };
        }
        if (existing.status === "Expired" && next.status === "Draft") {
          next = {
            ...next,
            status: existing.status,
            expiredAt: existing.expiredAt,
            validUntil: existing.validUntil,
            pdfSnapshot: existing.pdfSnapshot,
          };
        }
      }

      return next;
    }

    async function upsertQuote(quote: Quote): Promise<Quote> {
      const prev = quotesRef.current;
      const existing = prev.find((item) => item.id === quote.id);
      const normalized = enforceCapabilities(quote, existing);
      const saved = stampUpdatedAt(normalized);

      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const persisted = existing
            ? await updateQuoteInDb(saved)
            : await createQuoteInDb(saved);
          if (!persisted) {
            throw new Error("Failed to save quote.");
          }
          const merged = existing
            ? prev.map((item) =>
                item.id === persisted.id ? persisted : item,
              )
            : [persisted, ...prev];
          const next = commitQuotes(merged);
          setLastError(null);
          return next.find((item) => item.id === persisted.id) ?? persisted;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to save quote.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const merged = existing
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev];
      const next = commitQuotes(merged);
      setLastError(null);
      return next.find((item) => item.id === saved.id) ?? saved;
    }

    function buildDraft(
      snapshot: QuoteCustomerSnapshot,
      options?: { preparedBy?: string },
    ): Quote {
      if (!today) {
        throw new Error("Quote session is not ready");
      }
      if (!settingsReady) {
        throw new Error(
          "Company settings are not available. Wait until Settings finish loading, or fix the database connection and refresh.",
        );
      }
      const preparedBy = canOverridePreparedBy
        ? options?.preparedBy !== undefined
          ? options.preparedBy
          : sessionPreparedBy
        : sessionPreparedBy;

      return buildNewDraftQuote(
        quotesRef.current,
        today,
        snapshot,
        getQuoteDefaults(),
        preparedBy !== undefined ? { preparedBy } : undefined,
      );
    }

    async function createDraft(
      snapshot: QuoteCustomerSnapshot,
      draft: Quote,
    ): Promise<Quote> {
      const prev = quotesRef.current;
      const id = prev.some((quote) => quote.id === draft.id)
        ? crypto.randomUUID()
        : draft.id;
      const existing = prev.find((quote) => quote.id === id);
      const normalized = enforceCapabilities(
        { ...draft, id, customerSnapshot: snapshot },
        existing,
      );
      const saved = stampUpdatedAt(normalized);

      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const created = await createQuoteInDb(saved);
          const merged = [
            created,
            ...prev.filter((quote) => quote.id !== created.id),
          ];
          const next = commitQuotes(merged);
          setLastError(null);
          return next.find((item) => item.id === created.id) ?? created;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to create draft quote.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const merged = [saved, ...prev.filter((quote) => quote.id !== saved.id)];
      const next = commitQuotes(merged);
      setLastError(null);
      return next.find((item) => item.id === saved.id) ?? saved;
    }

    async function mutateAsync(
      id: string,
      fn: (quote: Quote, day: Date) => Quote,
      allowed = true,
    ): Promise<void> {
      if (!today || !allowed) return;
      assertMutationsReady("session");
      const prev = quotesRef.current;
      commitQuotes(
        prev.map((quote) => (quote.id === id ? fn(quote, today) : quote)),
      );
      setLastError(null);
    }

    async function replaceWithDbResult(
      id: string,
      updated: Quote | null,
      fallbackMessage: string,
    ): Promise<void> {
      if (!updated) {
        throw new Error(fallbackMessage);
      }
      const prev = quotesRef.current;
      commitQuotes(prev.map((quote) => (quote.id === id ? updated : quote)));
      setLastError(null);
    }

    async function duplicate(
      id: string,
      options?: { preparedBy?: string },
    ): Promise<Quote | null> {
      if (!today || !settingsReady) return null;

      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const copy = await duplicateQuoteInDb(id, options);
          if (!copy) return null;
          const next = commitQuotes([copy, ...quotesRef.current]);
          setLastError(null);
          return next.find((item) => item.id === copy.id) ?? copy;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to duplicate quote.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const prev = quotesRef.current;
      const source = prev.find((quote) => quote.id === id);
      if (!source) return null;
      let copy = duplicateQuote(source, prev, today, getQuoteDefaults());
      if (canOverridePreparedBy && options?.preparedBy !== undefined) {
        copy = { ...copy, preparedBy: options.preparedBy };
      } else if (sessionPreparedBy !== undefined) {
        copy = { ...copy, preparedBy: sessionPreparedBy };
      }
      const next = commitQuotes([copy, ...prev]);
      setLastError(null);
      return next.find((item) => item.id === copy.id) ?? copy;
    }

    async function archive(id: string): Promise<void> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await archiveQuoteInDb(id);
          if (!today) return;
          const prev = quotesRef.current;
          commitQuotes(
            prev.map((quote) =>
              quote.id === id ? archiveQuote(quote, today) : quote,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to archive quote.");
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, archiveQuote);
    }

    async function restore(id: string): Promise<void> {
      if (!canRestore) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await restoreQuoteInDb(id);
          if (!today) return;
          const prev = quotesRef.current;
          commitQuotes(
            prev.map((quote) =>
              quote.id === id ? restoreQuote(quote, today) : quote,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to restore quote.");
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, restoreQuote, canRestore);
    }

    async function markSent(id: string): Promise<void> {
      if (!settingsReady) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await markQuoteSentInDb(id);
          await replaceWithDbResult(id, updated, "Failed to mark quote as sent.");
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to mark quote as sent.");
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, (quote, day) => {
        const frozenAt = toIsoDate(startOfDay(day));
        const snapshot = createQuotePdfSnapshot(quote, settings, frozenAt);
        return markQuoteSent(quote, day, snapshot);
      });
    }

    async function returnToDraft(id: string): Promise<void> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await returnQuoteToDraftInDb(id);
          await replaceWithDbResult(
            id,
            updated,
            "Failed to return quote to draft.",
          );
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to return quote to draft.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, returnQuoteToDraft);
    }

    async function markAccepted(id: string): Promise<void> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await markQuoteAcceptedInDb(id);
          await replaceWithDbResult(
            id,
            updated,
            "Failed to mark quote as accepted.",
          );
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to mark quote as accepted.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, markQuoteAccepted);
    }

    async function markRejected(id: string): Promise<void> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await markQuoteRejectedInDb(id);
          await replaceWithDbResult(
            id,
            updated,
            "Failed to mark quote as rejected.",
          );
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to mark quote as rejected.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, markQuoteRejected);
    }

    async function markExpired(id: string): Promise<void> {
      if (!canOverrideQuoteStatus) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await markQuoteExpiredInDb(id);
          await replaceWithDbResult(
            id,
            updated,
            "Failed to mark quote as expired.",
          );
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to mark quote as expired.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, markQuoteExpired, canOverrideQuoteStatus);
    }

    async function reactivate(id: string): Promise<void> {
      if (!settingsReady || !canOverrideQuoteStatus) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await reactivateQuoteInDb(id);
          await replaceWithDbResult(id, updated, "Failed to reactivate quote.");
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to reactivate quote.");
          setLastError(message);
          throw new Error(message);
        }
      }
      await mutateAsync(id, (quote, day) =>
        reactivateQuoteToDraft(quote, day, getQuoteDefaults()),
      );
    }

    return {
      // Quote browsing/editing does not wait on Settings in session mode so
      // frozen PDFs stay usable after a Settings DB load failure.
      // Database mode waits for settingsReady + customersReady before ready.
      ready,
      persistenceMode,
      showHybridNotice,
      loadFailed,
      lastError,
      clearMutationError: () => {
        if (loadFailed) return;
        setLastError(null);
      },
      today,
      quotes,
      getQuote,
      upsertQuote,
      createDraft,
      buildDraft,
      duplicate,
      archive,
      restore,
      markSent,
      returnToDraft,
      markAccepted,
      markRejected,
      markExpired,
      reactivate,
    };
  }, [
    ready,
    loadFailed,
    persistenceMode,
    showHybridNotice,
    lastError,
    today,
    settingsReady,
    getQuoteDefaults,
    settings,
    currentUser?.fullName,
    capabilities.canOverridePreparedBy,
    capabilities.canRestore,
    capabilities.canOverrideQuoteStatus,
    quotes,
  ]);

  return (
    <QuoteSessionContext.Provider value={value}>
      {children}
    </QuoteSessionContext.Provider>
  );
}

export function useQuoteSession(): QuoteSessionContextValue {
  const ctx = useContext(QuoteSessionContext);
  if (!ctx) {
    throw new Error("useQuoteSession must be used within QuoteSessionProvider");
  }
  return ctx;
}
