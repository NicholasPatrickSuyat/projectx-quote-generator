"use client";

import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
import { useCustomerSession } from "@/components/session/customer-session-provider";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { applyAutoExpirations } from "@/lib/quotes/auto-expire";
import { getDemoQuotes, nextQuoteId } from "@/lib/quotes/demo-data";
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
  today: Date | null;
  quotes: Quote[];
  getQuote: (id: string) => Quote | undefined;
  upsertQuote: (quote: Quote) => Quote;
  createDraft: (snapshot: QuoteCustomerSnapshot, draft: Quote) => Quote;
  buildDraft: (
    snapshot: QuoteCustomerSnapshot,
    options?: { preparedBy?: string },
  ) => Quote;
  duplicate: (id: string, options?: { preparedBy?: string }) => Quote | null;
  archive: (id: string) => void;
  restore: (id: string) => void;
  markSent: (id: string) => void;
  returnToDraft: (id: string) => void;
  markAccepted: (id: string) => void;
  markRejected: (id: string) => void;
  markExpired: (id: string) => void;
  reactivate: (id: string) => void;
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

function stampUpdatedAt(quote: Quote): Quote {
  return withRecalculatedTotals({
    ...quote,
    updatedAt: toIsoDate(startOfDay(new Date())),
  });
}

export function QuoteSessionProvider({ children }: { children: ReactNode }) {
  const { ready: settingsReady, getQuoteDefaults, settings } =
    useCompanySettingsSession();
  const { applyQuoteAggregates, ready: customersReady } = useCustomerSession();
  const { currentUser, capabilities } = useDemoAuthSession();
  const today = useClientToday();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [seeded, setSeeded] = useState(false);
  const quotesRef = useRef(quotes);
  const applyQuoteAggregatesRef = useRef(applyQuoteAggregates);
  // Quotes list/edit can seed independently of Settings; Settings-gated
  // mutations must check settingsReady before calling getQuoteDefaults/settings.

  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    applyQuoteAggregatesRef.current = applyQuoteAggregates;
  }, [applyQuoteAggregates]);

  if (today && !seeded) {
    setSeeded(true);
    setQuotes(applyAutoExpirations(getDemoQuotes(today), today));
  }

  // Keep customer aggregates aligned with QuoteSession (including initial seed).
  useEffect(() => {
    if (!seeded || !customersReady) return;
    applyQuoteAggregatesRef.current(quotes);
  }, [seeded, customersReady, quotes]);

  const value = useMemo<QuoteSessionContextValue>(() => {
    const sessionPreparedBy = preparedByFromSessionUser(currentUser?.fullName);
    const canOverridePreparedBy = capabilities.canOverridePreparedBy;
    const canRestore = capabilities.canRestore;
    const canOverrideQuoteStatus = capabilities.canOverrideQuoteStatus;

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

    function upsertQuote(quote: Quote): Quote {
      const prev = quotesRef.current;
      const existing = prev.find((item) => item.id === quote.id);
      const normalized = enforceCapabilities(quote, existing);
      const saved = stampUpdatedAt(normalized);
      const merged = existing
        ? prev.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...prev];
      const next = commitQuotes(merged);
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

    function createDraft(snapshot: QuoteCustomerSnapshot, draft: Quote): Quote {
      const prev = quotesRef.current;
      const id = prev.some((quote) => quote.id === draft.id)
        ? nextQuoteId(prev)
        : draft.id;
      const existing = prev.find((quote) => quote.id === id);
      const normalized = enforceCapabilities(
        { ...draft, id, customerSnapshot: snapshot },
        existing,
      );
      const saved = stampUpdatedAt(normalized);
      const merged = [saved, ...prev.filter((quote) => quote.id !== saved.id)];
      const next = commitQuotes(merged);
      return next.find((item) => item.id === saved.id) ?? saved;
    }

    function mutate(
      id: string,
      fn: (quote: Quote, day: Date) => Quote,
      allowed = true,
    ) {
      if (!today || !allowed) return;
      const prev = quotesRef.current;
      commitQuotes(
        prev.map((quote) => (quote.id === id ? fn(quote, today) : quote)),
      );
    }

    function duplicate(
      id: string,
      options?: { preparedBy?: string },
    ): Quote | null {
      if (!today || !settingsReady) return null;
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
      return next.find((item) => item.id === copy.id) ?? copy;
    }

    return {
      // Quote browsing/editing does not wait on Settings so frozen PDFs stay usable
      // after a Settings DB load failure. Settings-gated APIs check settingsReady.
      ready: seeded,
      today,
      quotes,
      getQuote,
      upsertQuote,
      createDraft,
      buildDraft,
      duplicate,
      archive: (id) => mutate(id, archiveQuote),
      restore: (id) => mutate(id, restoreQuote, canRestore),
      markSent: (id) => {
        if (!settingsReady) return;
        mutate(id, (quote, day) => {
          const frozenAt = toIsoDate(startOfDay(day));
          const snapshot = createQuotePdfSnapshot(quote, settings, frozenAt);
          return markQuoteSent(quote, day, snapshot);
        });
      },
      returnToDraft: (id) => mutate(id, returnQuoteToDraft),
      markAccepted: (id) => mutate(id, markQuoteAccepted),
      markRejected: (id) => mutate(id, markQuoteRejected),
      markExpired: (id) => mutate(id, markQuoteExpired, canOverrideQuoteStatus),
      reactivate: (id) => {
        if (!settingsReady || !canOverrideQuoteStatus) return;
        mutate(id, (quote, day) =>
          reactivateQuoteToDraft(quote, day, getQuoteDefaults()),
        );
      },
    };
  }, [
    seeded,
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
