"use client";

import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
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
import { createQuotePdfSnapshot } from "@/lib/pdf/snapshot";
import { withRecalculatedTotals } from "@/lib/quotes/calculations";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { Quote, QuoteCustomerSnapshot } from "@/types/quote";
import {
  createContext,
  useContext,
  useMemo,
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
  buildDraft: (snapshot: QuoteCustomerSnapshot) => Quote;
  duplicate: (id: string) => Quote | null;
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
  const today = useClientToday();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [seeded, setSeeded] = useState(false);

  if (today && !seeded) {
    setSeeded(true);
    setQuotes(getDemoQuotes(today));
  }

  const value = useMemo<QuoteSessionContextValue>(() => {
    function getQuote(id: string) {
      return quotes.find((quote) => quote.id === id);
    }

    function upsertQuote(quote: Quote): Quote {
      const saved = stampUpdatedAt(quote);
      setQuotes((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        if (exists) {
          return prev.map((item) => (item.id === saved.id ? saved : item));
        }
        return [saved, ...prev];
      });
      return saved;
    }

    function buildDraft(snapshot: QuoteCustomerSnapshot): Quote {
      if (!today) {
        throw new Error("Quote session is not ready");
      }
      return buildNewDraftQuote(quotes, today, snapshot, getQuoteDefaults());
    }

    function createDraft(snapshot: QuoteCustomerSnapshot, draft: Quote): Quote {
      let saved!: Quote;
      setQuotes((prev) => {
        const id = prev.some((quote) => quote.id === draft.id)
          ? nextQuoteId(prev)
          : draft.id;
        saved = stampUpdatedAt({
          ...draft,
          id,
          customerSnapshot: snapshot,
        });
        return [saved, ...prev.filter((quote) => quote.id !== saved.id)];
      });
      return saved;
    }

    function mutate(id: string, fn: (quote: Quote, day: Date) => Quote) {
      if (!today) return;
      setQuotes((prev) =>
        prev.map((quote) => (quote.id === id ? fn(quote, today) : quote)),
      );
    }

    function duplicate(id: string): Quote | null {
      if (!today) return null;
      let copy: Quote | null = null;
      setQuotes((prev) => {
        const source = prev.find((quote) => quote.id === id);
        if (!source) return prev;
        copy = duplicateQuote(source, prev, today, getQuoteDefaults());
        return [copy, ...prev];
      });
      return copy;
    }

    return {
      ready: seeded && settingsReady,
      today,
      quotes,
      getQuote,
      upsertQuote,
      createDraft,
      buildDraft,
      duplicate,
      archive: (id) => mutate(id, archiveQuote),
      restore: (id) => mutate(id, restoreQuote),
      markSent: (id) =>
        mutate(id, (quote, day) => {
          const frozenAt = toIsoDate(startOfDay(day));
          const snapshot = createQuotePdfSnapshot(quote, settings, frozenAt);
          return markQuoteSent(quote, day, snapshot);
        }),
      returnToDraft: (id) => mutate(id, returnQuoteToDraft),
      markAccepted: (id) => mutate(id, markQuoteAccepted),
      markRejected: (id) => mutate(id, markQuoteRejected),
      markExpired: (id) => mutate(id, markQuoteExpired),
      reactivate: (id) =>
        mutate(id, (quote, day) =>
          reactivateQuoteToDraft(quote, day, getQuoteDefaults()),
        ),
    };
  }, [quotes, seeded, today, settingsReady, getQuoteDefaults, settings]);

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
