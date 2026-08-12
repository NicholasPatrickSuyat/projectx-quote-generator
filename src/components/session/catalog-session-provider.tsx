"use client";

import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import {
  archiveCatalogItemInDb,
  createCatalogItemInDb,
  duplicateCatalogItemInDb,
  getPersistencePublicInfo,
  loadCatalogFromDb,
  restoreCatalogItemInDb,
  updateCatalogItemInDb,
} from "@/lib/actions/persistence";
import { getDemoCatalogItems } from "@/lib/catalog/demo-data";
import {
  archiveCatalogItem,
  createCatalogItem,
  duplicateCatalogItem,
  restoreCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog/mutations";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CatalogSessionContextValue = {
  ready: boolean;
  persistenceMode: "session" | "database" | null;
  showHybridNotice: boolean;
  items: CatalogItem[];
  canManageCatalog: boolean;
  /** True when the initial database load failed. */
  loadFailed: boolean;
  lastError: string | null;
  /** Clears a prior mutation error. Does not hide an active database load failure. */
  clearMutationError: () => void;
  getItem: (id: string) => CatalogItem | undefined;
  createItem: (values: CatalogFormValues) => Promise<CatalogItem>;
  updateItem: (
    id: string,
    values: CatalogFormValues,
  ) => Promise<CatalogItem | null>;
  duplicateItem: (id: string) => Promise<CatalogItem | null>;
  archiveItem: (id: string) => Promise<void>;
  restoreItem: (id: string) => Promise<void>;
};

const CatalogSessionContext =
  createContext<CatalogSessionContextValue | null>(null);

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function CatalogSessionProvider({ children }: { children: ReactNode }) {
  const { capabilities } = useDemoAuthSession();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [ready, setReady] = useState(false);
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
          const loaded = await loadCatalogFromDb();
          if (cancelled) return;
          setItems(loaded);
          setLoadFailed(false);
        } else {
          setItems(getDemoCatalogItems(new Date()));
          setLoadFailed(false);
        }
        setLastError(null);
        setReady(true);
      } catch (error) {
        if (cancelled) return;
        setLastError(toErrorMessage(error, "Failed to load catalog."));
        setItems([]);
        setLoadFailed(true);
        setReady(true);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CatalogSessionContextValue>(() => {
    const canManage = capabilities.canManageCatalog;
    const mutationsEnabled =
      ready &&
      persistenceMode !== null &&
      !(persistenceMode === "database" && loadFailed);

    function assertMutationsReady(mode: "session" | "database") {
      if (!ready || persistenceMode === null) {
        throw new Error(
          "Catalog is still loading. Wait until persistence is ready before making changes.",
        );
      }
      if (persistenceMode === "database" && loadFailed) {
        throw new Error(
          "Catalog failed to load from the database. Refresh the page before making changes.",
        );
      }
      if (persistenceMode !== mode) {
        throw new Error(
          `Catalog persistence mode mismatch (expected ${mode}, got ${persistenceMode}).`,
        );
      }
    }

    function getItem(id: string) {
      return items.find((item) => item.id === id);
    }

    async function createItem(values: CatalogFormValues): Promise<CatalogItem> {
      if (!canManage) {
        throw new Error("Catalog management requires Admin access.");
      }
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const created = await createCatalogItemInDb(values);
          setItems((prev) => [created, ...prev]);
          setLastError(null);
          return created;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to create catalog item.");
          setLastError(message);
          throw new Error(message);
        }
      }
      assertMutationsReady("session");
      let created!: CatalogItem;
      setItems((prev) => {
        created = createCatalogItem(prev, values);
        return [created, ...prev];
      });
      setLastError(null);
      return created;
    }

    async function updateItem(
      id: string,
      values: CatalogFormValues,
    ): Promise<CatalogItem | null> {
      if (!canManage) return null;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const updated = await updateCatalogItemInDb(id, values);
          if (!updated) return null;
          setItems((prev) =>
            prev.map((item) => (item.id === id ? updated : item)),
          );
          setLastError(null);
          return updated;
        } catch (error) {
          const message = toErrorMessage(error, "Failed to update catalog item.");
          setLastError(message);
          throw new Error(message);
        }
      }
      assertMutationsReady("session");
      let updated: CatalogItem | null = null;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          updated = updateCatalogItem(item, values);
          return updated;
        }),
      );
      setLastError(null);
      return updated;
    }

    async function duplicateItem(id: string): Promise<CatalogItem | null> {
      if (!canManage) return null;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          const copy = await duplicateCatalogItemInDb(id);
          if (!copy) return null;
          setItems((prev) => [copy, ...prev]);
          setLastError(null);
          return copy;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to duplicate catalog item.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      assertMutationsReady("session");
      let copy: CatalogItem | null = null;
      setItems((prev) => {
        const source = prev.find((item) => item.id === id);
        if (!source) return prev;
        copy = duplicateCatalogItem(source, prev);
        return [copy, ...prev];
      });
      setLastError(null);
      return copy;
    }

    async function archiveItem(id: string): Promise<void> {
      if (!canManage) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await archiveCatalogItemInDb(id);
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? archiveCatalogItem(item) : item,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to archive catalog item.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      assertMutationsReady("session");
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? archiveCatalogItem(item) : item,
        ),
      );
      setLastError(null);
    }

    async function restoreItem(id: string): Promise<void> {
      if (!canManage) return;
      if (persistenceMode === "database") {
        assertMutationsReady("database");
        try {
          await restoreCatalogItemInDb(id);
          setItems((prev) =>
            prev.map((item) =>
              item.id === id ? restoreCatalogItem(item) : item,
            ),
          );
          setLastError(null);
          return;
        } catch (error) {
          const message = toErrorMessage(
            error,
            "Failed to restore catalog item.",
          );
          setLastError(message);
          throw new Error(message);
        }
      }
      assertMutationsReady("session");
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? restoreCatalogItem(item) : item,
        ),
      );
      setLastError(null);
    }

    return {
      ready,
      persistenceMode,
      showHybridNotice,
      items,
      canManageCatalog: canManage && mutationsEnabled,
      loadFailed,
      lastError,
      clearMutationError: () => {
        if (loadFailed) return;
        setLastError(null);
      },
      getItem,
      createItem,
      updateItem,
      duplicateItem,
      archiveItem,
      restoreItem,
    };
  }, [
    items,
    ready,
    loadFailed,
    persistenceMode,
    showHybridNotice,
    lastError,
    capabilities.canManageCatalog,
  ]);

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
