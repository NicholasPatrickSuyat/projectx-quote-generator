import type { LineCategory } from "@/types/quote";

export type CatalogRecordStatus = "Active" | "Archived";

export type CatalogItem = {
  id: string;
  /** UI label: Service Name */
  name: string;
  category: LineCategory;
  unit: string;
  unitPrice: number;
  description: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
};

export type CatalogFormValues = {
  name: string;
  category: LineCategory;
  unit: string;
  unitPrice: number;
  description: string;
};

export function catalogRecordStatus(
  item: Pick<CatalogItem, "archived">,
): CatalogRecordStatus {
  return item.archived ? "Archived" : "Active";
}

/** Description for quote lines: prefer description, else service name. */
export function catalogLineDescription(
  item: Pick<CatalogItem, "name" | "description">,
): string {
  const description = item.description.trim();
  return description || item.name.trim();
}
