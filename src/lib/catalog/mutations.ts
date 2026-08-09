import { nextCatalogId } from "@/lib/catalog/demo-data";
import { startOfDay, toIsoDate } from "@/lib/format";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";

function todayIso(): string {
  return toIsoDate(startOfDay(new Date()));
}

export function createCatalogItem(
  existing: CatalogItem[],
  values: CatalogFormValues,
): CatalogItem {
  const now = todayIso();
  return {
    id: nextCatalogId(existing),
    name: values.name.trim(),
    category: values.category,
    unit: values.unit.trim(),
    unitPrice: values.unitPrice,
    description: values.description.trim(),
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
}

export function updateCatalogItem(
  item: CatalogItem,
  values: CatalogFormValues,
): CatalogItem {
  return {
    ...item,
    name: values.name.trim(),
    category: values.category,
    unit: values.unit.trim(),
    unitPrice: values.unitPrice,
    description: values.description.trim(),
    updatedAt: todayIso(),
  };
}

export function duplicateCatalogItem(
  source: CatalogItem,
  existing: CatalogItem[],
): CatalogItem {
  const now = todayIso();
  return {
    id: nextCatalogId(existing),
    name: `${source.name} (Copy)`,
    category: source.category,
    unit: source.unit,
    unitPrice: source.unitPrice,
    description: source.description,
    createdAt: now,
    updatedAt: now,
    archived: false,
  };
}

export function archiveCatalogItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    archived: true,
    updatedAt: todayIso(),
  };
}

export function restoreCatalogItem(item: CatalogItem): CatalogItem {
  return {
    ...item,
    archived: false,
    updatedAt: todayIso(),
  };
}
