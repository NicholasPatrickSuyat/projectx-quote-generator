"use client";

import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import {
  archiveCustomerInDb,
  createCustomerInDb,
  loadCustomersFromDb,
  restoreCustomerInDb,
  updateCustomerInDb,
} from "@/lib/actions/customers";
import { getPersistencePublicInfo } from "@/lib/actions/persistence";
import {
  createCustomerId,
  getDemoCustomers,
  nextCustomerNumber,
} from "@/lib/customers/demo-data";
import { applyQuoteAggregatesToCustomers } from "@/lib/customers/quote-aggregates";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { Customer, CustomerFormValues } from "@/types/customer";
import type { Quote } from "@/types/quote";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type CustomerSessionContextValue = {
  ready: boolean;
  persistenceMode: "session" | "database" | null;
  showHybridNotice: boolean;
  customers: Customer[];
  loadFailed: boolean;
  lastError: string | null;
  clearMutationError: () => void;
  getCustomer: (id: string) => Customer | undefined;
  createCustomer: (values: CustomerFormValues) => Promise<Customer>;
  updateCustomer: (
    id: string,
    values: CustomerFormValues,
  ) => Promise<Customer | null>;
  archiveCustomer: (id: string) => Promise<void>;
  restoreCustomer: (id: string) => Promise<void>;
  /** Recompute quote aggregates from live QuoteSession quotes (non-archived only). */
  applyQuoteAggregates: (quotes: Quote[]) => void;
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
};

const CustomerSessionContext =
  createContext<CustomerSessionContextValue | null>(null);

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

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useDemoAuthSession();
  const today = useClientToday();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ready, setReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<
    "session" | "database" | null
  >(null);
  const [showHybridNotice, setShowHybridNotice] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const bootCompletedRef = useRef(false);

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
          const loaded = await loadCustomersFromDb();
          if (cancelled) return;
          setCustomers(loaded);
          setLoadFailed(false);
          setLastError(null);
          bootCompletedRef.current = true;
          setReady(true);
          return;
        }

        if (!today) return;
        setCustomers(getDemoCustomers(today));
        setLoadFailed(false);
        setLastError(null);
        bootCompletedRef.current = true;
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        setLastError(toErrorMessage(error, "Failed to load customers."));
        setCustomers([]);
        setLoadFailed(true);
        bootCompletedRef.current = true;
        setReady(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const applyQuoteAggregates = useCallback((quotes: Quote[]) => {
    setCustomers((prev) => applyQuoteAggregatesToCustomers(prev, quotes));
  }, []);

  const value = useMemo<CustomerSessionContextValue>(() => {
    const canRestore = capabilities.canRestore;

    function assertMutationsReady(mode: "session" | "database") {
      if (!ready || persistenceMode === null) {
        throw new Error(
          "Customers are still loading. Wait until persistence is ready before making changes.",
        );
      }
      if (persistenceMode === "database" && loadFailed) {
        throw new Error(
          "Customers failed to load from the database. Refresh the page before making changes.",
        );
      }
      if (persistenceMode !== mode) {
        throw new Error(
          `Customer persistence mode mismatch (expected ${mode}, got ${persistenceMode}).`,
        );
      }
    }

    function getCustomer(id: string) {
      return customers.find((customer) => customer.id === id);
    }

    async function createCustomer(
      values: CustomerFormValues,
    ): Promise<Customer> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const created = await createCustomerInDb(values);
          setCustomers((prev) => [created, ...prev]);
          setLastError(null);
          return created;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to create customer.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const now = toIsoDate(startOfDay(new Date()));
      const created: Customer = {
        id: createCustomerId(),
        customerNumber: nextCustomerNumber(customers),
        ...values,
        createdAt: now,
        updatedAt: now,
        archived: false,
        totalQuotes: 0,
        draftQuotes: 0,
        acceptedQuotes: 0,
        lastQuoteDate: null,
        recentQuotes: [],
      };
      setCustomers((prev) => [created, ...prev]);
      setLastError(null);
      return created;
    }

    async function updateCustomer(
      id: string,
      values: CustomerFormValues,
    ): Promise<Customer | null> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await updateCustomerInDb(id, values);
          if (!updated) return null;
          setCustomers((prev) =>
            prev.map((customer) => (customer.id === id ? updated : customer)),
          );
          setLastError(null);
          return updated;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to update customer.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const now = toIsoDate(startOfDay(new Date()));
      let updated: Customer | null = null;
      setCustomers((prev) =>
        prev.map((customer) => {
          if (customer.id !== id) return customer;
          updated = {
            ...customer,
            ...values,
            updatedAt: now,
          };
          return updated;
        }),
      );
      setLastError(null);
      return updated;
    }

    async function archiveCustomer(id: string): Promise<void> {
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await archiveCustomerInDb(id);
          const now = toIsoDate(startOfDay(new Date()));
          setCustomers((prev) =>
            prev.map((customer) =>
              customer.id === id
                ? { ...customer, archived: true, updatedAt: now }
                : customer,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to archive customer.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const now = toIsoDate(startOfDay(new Date()));
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, archived: true, updatedAt: now }
            : customer,
        ),
      );
      setLastError(null);
    }

    async function restoreCustomer(id: string): Promise<void> {
      if (!canRestore) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await restoreCustomerInDb(id);
          const now = toIsoDate(startOfDay(new Date()));
          setCustomers((prev) =>
            prev.map((customer) =>
              customer.id === id
                ? { ...customer, archived: false, updatedAt: now }
                : customer,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to restore customer.");
          setLastError(message);
          throw new Error(message);
        }
      }

      assertMutationsReady("session");
      const now = toIsoDate(startOfDay(new Date()));
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, archived: false, updatedAt: now }
            : customer,
        ),
      );
      setLastError(null);
    }

    return {
      ready,
      persistenceMode,
      showHybridNotice,
      customers,
      loadFailed,
      lastError,
      clearMutationError: () => {
        if (loadFailed) return;
        setLastError(null);
      },
      getCustomer,
      createCustomer,
      updateCustomer,
      archiveCustomer,
      restoreCustomer,
      applyQuoteAggregates,
      setCustomers,
    };
  }, [
    customers,
    ready,
    loadFailed,
    persistenceMode,
    showHybridNotice,
    lastError,
    capabilities.canRestore,
    applyQuoteAggregates,
  ]);

  return (
    <CustomerSessionContext.Provider value={value}>
      {children}
    </CustomerSessionContext.Provider>
  );
}

export function useCustomerSession(): CustomerSessionContextValue {
  const ctx = useContext(CustomerSessionContext);
  if (!ctx) {
    throw new Error(
      "useCustomerSession must be used within CustomerSessionProvider",
    );
  }
  return ctx;
}
