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
