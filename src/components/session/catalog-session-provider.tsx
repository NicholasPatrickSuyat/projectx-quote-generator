"use client";

import { getDemoCatalogItems } from "@/lib/catalog/demo-data";
import {
  archiveCatalogItem,
  createCatalogItem,
  duplicateCatalogItem,
  restoreCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog/mutations";
import { startOfDay } from "@/lib/format";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

/** Demo capability boundary — later becomes Admin-only. */
export const canManageCatalog = true;

type CatalogSessionContextValue = {
  ready: boolean;
  items: CatalogItem[];
  canManageCatalog: boolean;
  getItem: (id: string) => CatalogItem | undefined;
  createItem: (values: CatalogFormValues) => CatalogItem;
  updateItem: (id: string, values: CatalogFormValues) => CatalogItem | null;
  duplicateItem: (id: string) => CatalogItem | null;
  archiveItem: (id: string) => void;
  restoreItem: (id: string) => void;
};

const CatalogSessionContext =
  createContext<CatalogSessionContextValue | null>(null);

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

export function CatalogSessionProvider({ children }: { children: ReactNode }) {
  const today = useClientToday();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [seeded, setSeeded] = useState(false);

  if (today && !seeded) {
    setSeeded(true);
    setItems(getDemoCatalogItems(today));
  }

  const value = useMemo<CatalogSessionContextValue>(() => {
    function getItem(id: string) {
      return items.find((item) => item.id === id);
    }

    function createItem(values: CatalogFormValues): CatalogItem {
      let created!: CatalogItem;
      setItems((prev) => {
        created = createCatalogItem(prev, values);
        return [created, ...prev];
      });
      return created;
    }

    function updateItem(
      id: string,
      values: CatalogFormValues,
    ): CatalogItem | null {
      let updated: CatalogItem | null = null;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          updated = updateCatalogItem(item, values);
          return updated;
        }),
      );
      return updated;
    }

    function duplicateItem(id: string): CatalogItem | null {
      let copy: CatalogItem | null = null;
      setItems((prev) => {
        const source = prev.find((item) => item.id === id);
        if (!source) return prev;
        copy = duplicateCatalogItem(source, prev);
        return [copy, ...prev];
      });
      return copy;
    }

    function archiveItem(id: string) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? archiveCatalogItem(item) : item,
        ),
      );
    }

    function restoreItem(id: string) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? restoreCatalogItem(item) : item,
        ),
      );
    }

    return {
      ready: seeded,
      items,
      canManageCatalog,
      getItem,
      createItem,
      updateItem,
      duplicateItem,
      archiveItem,
      restoreItem,
    };
  }, [items, seeded]);

  return (
    <CatalogSessionContext.Provider value={value}>
      {children}
    </CatalogSessionContext.Provider>
  );
}

export function useCatalogSession(): CatalogSessionContextValue {
  const ctx = useContext(CatalogSessionContext);
  if (!ctx) {
    throw new Error(
      "useCatalogSession must be used within CatalogSessionProvider",
    );
  }
  return ctx;
}
