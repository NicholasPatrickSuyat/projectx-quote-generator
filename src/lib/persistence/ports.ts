import type { CatalogFormValues, CatalogItem } from "@/types/catalog";
import type {
  CompanyQuoteDefaults,
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";
import type { Customer, CustomerFormValues } from "@/types/customer";
import type { Quote } from "@/types/quote";

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

/**
 * Durable customers (M19).
 * Full list load for providers (D9); optional pagination opts reserved for later.
 */
export interface CustomerRepository {
  /** Load all company customers. Aggregates are zeroed — filled client-side. */
  list(): Promise<Customer[]>;
  get(id: string): Promise<Customer | undefined>;
  getByNumber(customerNumber: string): Promise<Customer | undefined>;
  create(
    values: CustomerFormValues,
    options?: { id?: string },
  ): Promise<Customer>;
  update(id: string, values: CustomerFormValues): Promise<Customer | null>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}

/**
 * Durable quotes + line items (M19).
 * Prefer applying pure mutations from lib/quotes/mutations.ts then persisting,
 * or encapsulating those mutations inside lifecycle methods.
 */
export interface QuoteRepository {
  /** Load quotes with lines; lazy auto-expire Sent past valid_until. */
  list(): Promise<Quote[]>;
  get(id: string): Promise<Quote | undefined>;
  /** Create draft/quote; allocates quote_number server-side; accepts client UUIDs. */
  create(quote: Quote): Promise<Quote>;
  /** Update header + reconcile lines atomically. quoteNumber immutable. */
  update(quote: Quote): Promise<Quote | null>;
  duplicate(
    id: string,
    defaults: CompanyQuoteDefaults,
    options?: { preparedBy?: string },
  ): Promise<Quote | null>;
  archive(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  /** Freeze PDF snapshot server-side from quote + company settings; no client snapshot. */
  markSent(id: string): Promise<Quote | null>;
  returnToDraft(id: string): Promise<Quote | null>;
  markAccepted(id: string): Promise<Quote | null>;
  markRejected(id: string): Promise<Quote | null>;
  markExpired(id: string): Promise<Quote | null>;
  reactivate(
    id: string,
    defaults: CompanyQuoteDefaults,
  ): Promise<Quote | null>;
}
