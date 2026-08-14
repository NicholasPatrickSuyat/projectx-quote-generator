import { integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { company } from "./company";
import { entityCounterTypeEnum } from "./enums";

/**
 * Per-company sequential allocators for customer_number / quote_number.
 * next_value is the next integer to assign (1 → CUST-000001 / QUO-000001).
 * Allocation must run inside the same transaction as the insert.
 */
export const entityCounters = pgTable(
  "entity_counters",
  {
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    entityType: entityCounterTypeEnum("entity_type").notNull(),
    nextValue: integer("next_value").notNull().default(1),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.companyId, table.entityType],
      name: "entity_counters_pk",
    }),
  ],
);
