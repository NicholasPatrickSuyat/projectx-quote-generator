"use client";

import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { getDemoCustomers, nextCustomerId } from "@/lib/customers/demo-data";
import { applyQuoteAggregatesToCustomers } from "@/lib/customers/quote-aggregates";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { Customer, CustomerFormValues } from "@/types/customer";
import type { Quote } from "@/types/quote";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type CustomerSessionContextValue = {
  ready: boolean;
  customers: Customer[];
  getCustomer: (id: string) => Customer | undefined;
  createCustomer: (values: CustomerFormValues) => Customer;
  updateCustomer: (id: string, values: CustomerFormValues) => Customer | null;
  archiveCustomer: (id: string) => void;
  restoreCustomer: (id: string) => void;
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

export function CustomerSessionProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useDemoAuthSession();
  const today = useClientToday();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [seeded, setSeeded] = useState(false);

  if (today && !seeded) {
    setSeeded(true);
    setCustomers(getDemoCustomers(today));
  }

  const applyQuoteAggregates = useCallback((quotes: Quote[]) => {
    setCustomers((prev) => applyQuoteAggregatesToCustomers(prev, quotes));
  }, []);

  const value = useMemo<CustomerSessionContextValue>(() => {
    const canRestore = capabilities.canRestore;

    function getCustomer(id: string) {
      return customers.find((customer) => customer.id === id);
    }

    function createCustomer(values: CustomerFormValues): Customer {
      const now = toIsoDate(startOfDay(new Date()));
      const created: Customer = {
        id: nextCustomerId(customers),
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
      return created;
    }

    function updateCustomer(
      id: string,
      values: CustomerFormValues,
    ): Customer | null {
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
      return updated;
    }

    function archiveCustomer(id: string) {
      const now = toIsoDate(startOfDay(new Date()));
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, archived: true, updatedAt: now }
            : customer,
        ),
      );
    }

    function restoreCustomer(id: string) {
      if (!canRestore) return;
      const now = toIsoDate(startOfDay(new Date()));
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id
            ? { ...customer, archived: false, updatedAt: now }
            : customer,
        ),
      );
    }

    return {
      ready: seeded,
      customers,
      getCustomer,
      createCustomer,
      updateCustomer,
      archiveCustomer,
      restoreCustomer,
      applyQuoteAggregates,
      setCustomers,
    };
  }, [customers, seeded, capabilities.canRestore, applyQuoteAggregates]);

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
