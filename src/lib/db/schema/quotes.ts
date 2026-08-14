import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { company } from "./company";
import { customers } from "./customers";
import { catalogCategoryEnum, discountTypeEnum, quoteStatusEnum } from "./enums";
import { appUsers } from "./users";
import type { QuoteCustomerSnapshot, QuotePdfSnapshot } from "@/types/quote";

/**
 * Durable quotes (M19).
 * Business identifier: quote_number (QUO-000001).
 * Live lines: quote_line_items. Frozen Final PDF: pdf_snapshot JSONB.
 * Composite FK (company_id, customer_id) prevents cross-company customer links.
 */
export const quotes = pgTable(
  "quotes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    quoteNumber: text("quote_number").notNull(),
    customerId: uuid("customer_id").notNull(),
    /** Historical customer fields at quote time — not rewritten on customer edit. */
    customerSnapshot: jsonb("customer_snapshot")
      .$type<QuoteCustomerSnapshot>()
      .notNull(),
    jobDescription: text("job_description").notNull().default(""),
    status: quoteStatusEnum("status").notNull().default("Draft"),
    quoteDate: text("quote_date").notNull(),
    validUntil: text("valid_until"),
    preparedByUserId: uuid("prepared_by_user_id").references(() => appUsers.id, {
      onDelete: "set null",
    }),
    /** Historical/display name — survives user deactivation. */
    preparedBy: text("prepared_by").notNull().default(""),
    internalNotes: text("internal_notes").notNull().default(""),
    customerFacingMessage: text("customer_message").notNull().default(""),
    termsAndConditions: text("terms_and_conditions").notNull().default(""),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountType: discountTypeEnum("discount_type").notNull().default("none"),
    discountValue: numeric("discount_value", {
      precision: 12,
      scale: 4,
    })
      .notNull()
      .default("0"),
    discountCents: integer("discount_cents").notNull().default(0),
    taxRate: numeric("tax_rate", { precision: 8, scale: 4 }).notNull().default("0"),
    taxCents: integer("tax_cents").notNull().default(0),
    grandTotalCents: integer("grand_total_cents").notNull().default(0),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    archived: boolean("archived").notNull().default(false),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    statusBeforeArchive: quoteStatusEnum("status_before_archive"),
    pdfSnapshot: jsonb("pdf_snapshot").$type<QuotePdfSnapshot | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId, table.customerId],
      foreignColumns: [customers.companyId, customers.id],
      name: "quotes_company_customer_fk",
    }),
    uniqueIndex("quotes_company_number_uidx").on(
      table.companyId,
      table.quoteNumber,
    ),
    uniqueIndex("quotes_company_id_id_uidx").on(table.companyId, table.id),
    index("quotes_company_status_idx").on(table.companyId, table.status),
    index("quotes_company_archived_idx").on(table.companyId, table.archived),
    index("quotes_company_customer_idx").on(table.companyId, table.customerId),
    index("quotes_company_valid_until_idx").on(
      table.companyId,
      table.validUntil,
    ),
    index("quotes_company_quote_date_idx").on(table.companyId, table.quoteDate),
    index("quotes_company_number_idx").on(table.companyId, table.quoteNumber),
  ],
);

/**
 * Live editable line items. Frozen copies also live inside quotes.pdf_snapshot.
 * Quantity is numeric to preserve decimal quantities used by the builder.
 * Composite FK (company_id, quote_id) keeps lines inside the quote's company.
 */
export const quoteLineItems = pgTable(
  "quote_line_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    quoteId: uuid("quote_id").notNull(),
    category: catalogCategoryEnum("category").notNull(),
    description: text("description").notNull().default(""),
    quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
    unit: text("unit").notNull().default(""),
    unitPriceCents: integer("unit_price_cents").notNull().default(0),
    lineTotalCents: integer("line_total_cents").notNull().default(0),
    internalNotes: text("internal_notes").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      columns: [table.companyId, table.quoteId],
      foreignColumns: [quotes.companyId, quotes.id],
      name: "quote_line_items_company_quote_fk",
    }).onDelete("cascade"),
    index("quote_line_items_quote_sort_idx").on(table.quoteId, table.sortOrder),
    index("quote_line_items_company_quote_idx").on(
      table.companyId,
      table.quoteId,
    ),
    check(
      "quote_line_items_quantity_positive",
      sql`${table.quantity}::numeric > 0`,
    ),
  ],
);
