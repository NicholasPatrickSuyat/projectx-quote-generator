import { sql } from "drizzle-orm";
import {
  check,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { discountTypeEnum } from "./enums";

/** Single-company-per-installation anchor (no multi-tenant RLS). */
export const company = pgTable("company", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Temporary M17 logo storage — data URL JSON matching CompanyLogo.
 * Future milestones may move bytes to object storage / URL references.
 */
export type LogoJson = {
  dataUrl: string;
  fileName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  byteLength: number;
};

export const companySettings = pgTable(
  "company_settings",
  {
    companyId: uuid("company_id")
      .primaryKey()
      .references(() => company.id, { onDelete: "cascade" }),
    companyName: text("company_name").notNull(),
    phone: text("phone").notNull(),
    email: text("email").notNull(),
    website: text("website").notNull().default(""),
    street: text("street").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    zip: text("zip").notNull(),
    logoJson: jsonb("logo_json").$type<LogoJson | null>(),
    currency: text("currency").notNull().default("USD"),
    taxRate: numeric("tax_rate", { precision: 8, scale: 4 }).notNull(),
    quoteValidityDays: integer("quote_validity_days").notNull(),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: numeric("discount_value", {
      precision: 12,
      scale: 4,
    }).notNull(),
    preparedBy: text("prepared_by").notNull().default(""),
    customerFacingMessage: text("customer_facing_message").notNull(),
    termsAndConditions: text("terms_and_conditions").notNull(),
    pdfFooterText: text("pdf_footer_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("company_settings_currency_usd", sql`${table.currency} = 'USD'`),
  ],
);
