"use server";

import {
  assertCanManageCatalogForDatabaseMutation,
  assertCanManageSettingsForDatabaseMutation,
} from "@/lib/auth/assert-capability";
import { createDbCatalogRepository } from "@/lib/persistence/db-catalog-repository";
import { createDbCompanySettingsRepository } from "@/lib/persistence/db-company-settings-repository";
import {
  getPersistenceMode,
  assertDatabaseAccessAllowed,
} from "@/lib/persistence/mode";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import type {
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";

export type PersistencePublicInfo = {
  mode: "session" | "database";
  showHybridNotice: boolean;
};

export async function getPersistencePublicInfo(): Promise<PersistencePublicInfo> {
  const mode = getPersistenceMode();
  return {
    mode,
    showHybridNotice: mode === "database",
  };
}

export async function loadCompanySettingsFromDb(): Promise<CompanySettings> {
  assertDatabaseAccessAllowed();
  return createDbCompanySettingsRepository().get();
}

export async function saveCompanySettingsToDb(
  values: CompanySettingsFormValues,
): Promise<CompanySettings> {
  assertCanManageSettingsForDatabaseMutation();
  return createDbCompanySettingsRepository().save(values);
}

export async function loadCatalogFromDb(): Promise<CatalogItem[]> {
  assertDatabaseAccessAllowed();
  return createDbCatalogRepository().list();
}

export async function createCatalogItemInDb(
  values: CatalogFormValues,
): Promise<CatalogItem> {
  assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().create(values);
}

export async function updateCatalogItemInDb(
  id: string,
  values: CatalogFormValues,
): Promise<CatalogItem | null> {
  assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().update(id, values);
}

export async function duplicateCatalogItemInDb(
  id: string,
): Promise<CatalogItem | null> {
  assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().duplicate(id);
}

export async function archiveCatalogItemInDb(id: string): Promise<void> {
  assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().archive(id);
}

export async function restoreCatalogItemInDb(id: string): Promise<void> {
  assertCanManageCatalogForDatabaseMutation();
  return createDbCatalogRepository().restore(id);
}
