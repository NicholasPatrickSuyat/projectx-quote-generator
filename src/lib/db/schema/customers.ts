import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { company } from "./company";

/**
 * Durable customers (M19).
 * Business identifier: customer_number (CUST-000001).
 * Internal PK: UUID. Quote aggregates are derived, not stored.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    customerNumber: text("customer_number").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    companyName: text("company_name"),
    phone: text("phone").notNull(),
    email: text("email").notNull().default(""),
    street: text("street").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    internalNotes: text("internal_notes").notNull().default(""),
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
    uniqueIndex("customers_company_number_uidx").on(
      table.companyId,
      table.customerNumber,
    ),
    /** Enables composite FK from quotes(company_id, customer_id). */
    uniqueIndex("customers_company_id_id_uidx").on(table.companyId, table.id),
    index("customers_company_archived_idx").on(table.companyId, table.archived),
    index("customers_company_number_idx").on(
      table.companyId,
      table.customerNumber,
    ),
    index("customers_company_name_idx").on(
      table.companyId,
      table.lastName,
      table.firstName,
    ),
  ],
);
