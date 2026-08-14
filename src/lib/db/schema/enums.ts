import { pgEnum } from "drizzle-orm/pg-core";

export const catalogCategoryEnum = pgEnum("catalog_category", [
  "Services",
  "Materials",
  "Labor",
]);

export const discountTypeEnum = pgEnum("discount_type", [
  "none",
  "percent",
  "fixed",
]);

export const userRoleEnum = pgEnum("user_role", ["Admin", "Office Staff"]);

/** Live quote workflow status (Archived is a boolean flag, not a status). */
export const quoteStatusEnum = pgEnum("quote_status", [
  "Draft",
  "Sent",
  "Accepted",
  "Rejected",
  "Expired",
]);

/** Per-company sequential allocators for business identifiers. */
export const entityCounterTypeEnum = pgEnum("entity_counter_type", [
  "customer",
  "quote",
]);
