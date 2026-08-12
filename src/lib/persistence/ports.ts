import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import type {
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";

export interface CompanySettingsRepository {
  get(): Promise<CompanySettings>;
  save(values: CompanySettingsFormValues): Promise<CompanySettings>;
}

export interface CatalogRepository {
  list(): Promise<CatalogItem[]>;
  get(id: string): Promise<CatalogItem | undefined>;
  create(values: CatalogFormValues): Promise<CatalogItem>;
  update(id: string, values: CatalogFormValues): Promise<CatalogItem | null>;
  duplicate(id: string): Promise<CatalogItem | null>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
