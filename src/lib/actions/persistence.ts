"use server";

import {
  assertCanManageCatalogForDatabaseMutation,
  assertCanManageSettingsForDatabaseMutation,
  assertCanReadCatalogFromDatabase,
  assertCanReadSettingsFromDatabase,
} from "@/lib/auth/assert-capability";
import { createDbCatalogRepository } from "@/lib/persistence/db-catalog-repository";
import { createDbCompanySettingsRepository } from "@/lib/persistence/db-company-settings-repository";
import { getPersistenceMode } from "@/lib/persistence/mode";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import type {
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";

export type PersistencePublicInfo = {
  mode: "session" | "database";
  showHybridNotice: boolean;
};

/**
 * Non-sensitive mode metadata for UX notices.
 * Does not expose durable application data — intentionally unauthenticated.
 */
export async function getPersistencePublicInfo(): Promise<PersistencePublicInfo> {
  const mode = getPersistenceMode();
  const { getAuthMode } = await import("@/lib/auth/mode");
  // Client production (AUTH_MODE=production) must not show local-dev hybrid copy.
  const showHybridNotice =
    mode === "database" && getAuthMode() !== "production";
  return {
    mode,
    showHybridNotice,
  };
}

export async function loadCompanySettingsFromDb(): Promise<CompanySettings> {
  await assertCanReadSettingsFromDatabase();
  return createDbCompanySettingsRepository().get();
}

export async function saveCompanySettingsToDb(
  values: CompanySettingsFormValues,
): Promise<CompanySettings> {
  await assertCanManageSettingsForDatabaseMutation();
  return createDbCompanySettingsRepository().save(values);
}

export async function loadCatalogFromDb(): Promise<CatalogItem[]> {
  await assertCanReadCatalogFromDatabase();
  return createDbCatalogRepository().list();
}

export async function createCatalogItemInDb(
  values: CatalogFormValues,
): Promise<CatalogItem> {
  await assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().create(values);
}

export async function updateCatalogItemInDb(
  id: string,
  values: CatalogFormValues,
): Promise<CatalogItem | null> {
  await assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().update(id, values);
}

export async function duplicateCatalogItemInDb(
  id: string,
): Promise<CatalogItem | null> {
  await assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().duplicate(id);
}

export async function archiveCatalogItemInDb(id: string): Promise<void> {
  await assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().archive(id);
}

export async function restoreCatalogItemInDb(id: string): Promise<void> {
  await assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().restore(id);
}
