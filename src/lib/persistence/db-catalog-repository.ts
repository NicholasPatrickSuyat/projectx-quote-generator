import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { catalogItems, company } from "@/lib/db/schema";
import { nextCatalogId } from "@/lib/catalog/demo-data";
import { validateCatalogForm } from "@/lib/catalog/filters";
import {
  archiveCatalogItem,
  createCatalogItem,
  duplicateCatalogItem,
  restoreCatalogItem,
  updateCatalogItem,
} from "@/lib/catalog/mutations";
import {
  catalogRowToDomain,
  dollarsToUnitPriceCents,
} from "@/lib/persistence/mappers";
import type { CatalogRepository } from "@/lib/persistence/ports";
import { assertServerModule } from "@/lib/server-module";
import type { CatalogFormValues, CatalogItem } from "@/types/catalog";

assertServerModule("@/lib/persistence/db-catalog-repository");

function assertValidCatalogValues(values: CatalogFormValues): void {
  const errors = validateCatalogForm(values);
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as {
    code?: string;
    cause?: { code?: string };
    message?: string;
  };
  return (
    candidate.code === "23505" ||
    candidate.cause?.code === "23505" ||
    (typeof candidate.message === "string" &&
      /duplicate key|unique constraint/i.test(candidate.message))
  );
}

async function insertCatalogWithRetry(
  companyId: string,
  buildItem: (existing: CatalogItem[]) => CatalogItem,
): Promise<CatalogItem> {
  const db = getDb();
  let lastError: unknown;
  for (let attempt = 0; attempt < 8; attempt++) {
    const existingRows = await db
      .select()
      .from(catalogItems)
      .where(eq(catalogItems.companyId, companyId));
    const existing = existingRows.map(catalogRowToDomain);
    const item = buildItem(existing);
    item.id = nextCatalogId(existing);
    try {
      const inserted = await db
        .insert(catalogItems)
        .values(toInsertRow(item, companyId, null))
        .returning();
      return catalogRowToDomain(inserted[0]);
    } catch (error) {
      lastError = error;
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to allocate a unique catalog item id.");
}

async function requireSingletonCompanyId(): Promise<string> {
  const db = getDb();
  const rows = await db.select({ id: company.id }).from(company).limit(2);
  if (rows.length === 0) {
    throw new Error(
      "No company row found. Run npm run db:bootstrap:company first.",
    );
  }
  if (rows.length > 1) {
    throw new Error(
      "Multiple company rows found. M17 expects a single-company installation.",
    );
  }
  return rows[0].id;
}

function toInsertRow(item: CatalogItem, companyId: string, archivedAt: Date | null) {
  return {
    id: item.id,
    companyId,
    name: item.name,
    category: item.category,
    description: item.description,
    unit: item.unit,
    unitPriceCents: dollarsToUnitPriceCents(item.unitPrice),
    archived: item.archived,
    archivedAt,
    createdAt: new Date(`${item.createdAt}T12:00:00.000Z`),
    updatedAt: new Date(`${item.updatedAt}T12:00:00.000Z`),
  };
}

export function createDbCatalogRepository(): CatalogRepository {
  return {
    async list(): Promise<CatalogItem[]> {
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const rows = await db
        .select()
        .from(catalogItems)
        .where(eq(catalogItems.companyId, companyId))
        .orderBy(asc(catalogItems.name));
      return rows.map(catalogRowToDomain);
    },

    async get(id: string): Promise<CatalogItem | undefined> {
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const rows = await db
        .select()
        .from(catalogItems)
        .where(
          and(eq(catalogItems.companyId, companyId), eq(catalogItems.id, id)),
        )
        .limit(1);
      return rows[0] ? catalogRowToDomain(rows[0]) : undefined;
    },

    async create(values: CatalogFormValues): Promise<CatalogItem> {
      assertValidCatalogValues(values);
      const companyId = await requireSingletonCompanyId();
      return insertCatalogWithRetry(companyId, (existing) =>
        createCatalogItem(existing, values),
      );
    },

    async update(
      id: string,
      values: CatalogFormValues,
    ): Promise<CatalogItem | null> {
      assertValidCatalogValues(values);
      const current = await this.get(id);
      if (!current) return null;
      const updated = updateCatalogItem(current, values);
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const rows = await db
        .update(catalogItems)
        .set({
          name: updated.name,
          category: updated.category,
          description: updated.description,
          unit: updated.unit,
          unitPriceCents: dollarsToUnitPriceCents(updated.unitPrice),
          updatedAt: new Date(),
        })
        .where(
          and(eq(catalogItems.companyId, companyId), eq(catalogItems.id, id)),
        )
        .returning();
      return rows[0] ? catalogRowToDomain(rows[0]) : null;
    },

    async duplicate(id: string): Promise<CatalogItem | null> {
      const source = await this.get(id);
      if (!source) return null;
      const companyId = await requireSingletonCompanyId();
      return insertCatalogWithRetry(companyId, (existing) =>
        duplicateCatalogItem(source, existing),
      );
    },

    async archive(id: string): Promise<void> {
      const current = await this.get(id);
      if (!current || current.archived) return;
      const archived = archiveCatalogItem(current);
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const now = new Date();
      await db
        .update(catalogItems)
        .set({
          archived: true,
          archivedAt: now,
          updatedAt: now,
        })
        .where(
          and(eq(catalogItems.companyId, companyId), eq(catalogItems.id, id)),
        );
      void archived;
    },

    async restore(id: string): Promise<void> {
      const current = await this.get(id);
      if (!current || !current.archived) return;
      const restored = restoreCatalogItem(current);
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      await db
        .update(catalogItems)
        .set({
          archived: false,
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(eq(catalogItems.companyId, companyId), eq(catalogItems.id, id)),
        );
      void restored;
    },
  };
}
