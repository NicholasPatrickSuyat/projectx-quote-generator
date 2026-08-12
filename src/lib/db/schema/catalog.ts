import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { company } from "./company";
import { catalogCategoryEnum } from "./enums";

export const catalogItems = pgTable(
  "catalog_items",
  {
    id: text("id").primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: catalogCategoryEnum("category").notNull(),
    description: text("description").notNull().default(""),
    unit: text("unit").notNull(),
    unitPriceCents: integer("unit_price_cents").notNull(),
    archived: boolean("archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("catalog_items_company_id_idx").on(table.companyId),
    index("catalog_items_company_archived_idx").on(
      table.companyId,
      table.archived,
    ),
    index("catalog_items_company_category_idx").on(
      table.companyId,
      table.category,
    ),
    index("catalog_items_company_name_idx").on(table.companyId, table.name),
  ],
);
