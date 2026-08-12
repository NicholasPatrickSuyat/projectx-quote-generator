import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import { LINE_CATEGORIES, type LineCategory } from "@/types/quote";

export type CatalogArchiveFilter = "active" | "archived";

export type CatalogSortOption =
  | "name"
  | "category"
  | "price"
  | "status"
  | "updated";

export type CatalogFilters = {
  query: string;
  archive: CatalogArchiveFilter;
  category: LineCategory | "all";
  sort: CatalogSortOption;
  sortDir: "asc" | "desc";
};

export type CatalogFieldErrors = {
  name?: string;
  category?: string;
  unit?: string;
  unitPrice?: string;
  description?: string;
};

const CATALOG_NAME_MAX = 200;
const CATALOG_UNIT_MAX = 40;
const CATALOG_DESCRIPTION_MAX = 2000;
/** Matches Postgres integer cents capacity with headroom (~$21M). */
const CATALOG_UNIT_PRICE_MAX = 21_000_000;

export const DEFAULT_CATALOG_FILTERS: CatalogFilters = {
  query: "",
  archive: "active",
  category: "all",
  sort: "name",
  sortDir: "asc",
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesCatalogSearch(
  item: CatalogItem,
  query: string,
): boolean {
  const q = normalize(query);
  if (!q) return true;
  return [
    item.name,
    item.description,
    item.category,
    item.unit,
  ]
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export function filterCatalogItems(
  items: CatalogItem[],
  filters: CatalogFilters,
): CatalogItem[] {
  const filtered = items.filter((item) => {
    const archiveOk =
      filters.archive === "active" ? !item.archived : item.archived;
    if (!archiveOk) return false;
    if (filters.category !== "all" && item.category !== filters.category) {
      return false;
    }
    return matchesCatalogSearch(item, filters.query);
  });

  const direction = filters.sortDir === "asc" ? 1 : -1;

  return [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "category":
        return (
          a.category.localeCompare(b.category) * direction ||
          a.name.localeCompare(b.name)
        );
      case "price":
        return (a.unitPrice - b.unitPrice) * direction || a.name.localeCompare(b.name);
      case "status": {
        const aStatus = a.archived ? 1 : 0;
        const bStatus = b.archived ? 1 : 0;
        return (aStatus - bStatus) * direction || a.name.localeCompare(b.name);
      }
      case "updated":
        return (
          a.updatedAt.localeCompare(b.updatedAt) * direction ||
          a.name.localeCompare(b.name)
        );
      case "name":
      default:
        return a.name.localeCompare(b.name) * direction;
    }
  });
}

/** Active-only filter for the Quote Builder picker. */
export function filterActiveCatalogForPicker(
  items: CatalogItem[],
  search: string,
  category: LineCategory | "all",
): CatalogItem[] {
  return filterCatalogItems(items, {
    query: search,
    archive: "active",
    category,
    sort: "name",
    sortDir: "asc",
  });
}

export function hasActiveListFilters(filters: CatalogFilters): boolean {
  return Boolean(filters.query.trim() || filters.category !== "all");
}

export function validateCatalogForm(
  values: CatalogFormValues,
): CatalogFieldErrors {
  const errors: CatalogFieldErrors = {};
  const name = values.name.trim();
  const unit = values.unit.trim();
  const description = values.description.trim();

  if (!name) {
    errors.name = "Service name is required.";
  } else if (name.length > CATALOG_NAME_MAX) {
    errors.name = `Service name must be ${CATALOG_NAME_MAX} characters or fewer.`;
  }

  if (!values.category) {
    errors.category = "Category is required.";
  } else if (
    !(LINE_CATEGORIES as readonly string[]).includes(values.category)
  ) {
    errors.category = "Category must be Services, Materials, or Labor.";
  }

  if (unit.length > CATALOG_UNIT_MAX) {
    errors.unit = `Unit must be ${CATALOG_UNIT_MAX} characters or fewer.`;
  }

  if (!Number.isFinite(values.unitPrice) || values.unitPrice < 0) {
    errors.unitPrice = "Default unit price must be zero or greater.";
  } else if (values.unitPrice > CATALOG_UNIT_PRICE_MAX) {
    errors.unitPrice = `Default unit price must be ${CATALOG_UNIT_PRICE_MAX.toLocaleString("en-US")} or less.`;
  }

  if (description.length > CATALOG_DESCRIPTION_MAX) {
    errors.description = `Description must be ${CATALOG_DESCRIPTION_MAX} characters or fewer.`;
  }

  return errors;
}
