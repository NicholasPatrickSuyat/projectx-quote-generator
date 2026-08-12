import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { company } from "./company";
import { userRoleEnum } from "./enums";

/**
 * Application users for AUTH_MODE=production (M18).
 * Single company per installation — company_id scopes uniqueness.
 *
 * authVersion: incremented on password reset, role change, and deactivation
 * so existing JWTs become invalid (reactivation does not revive old tokens).
 */
export const appUsers = pgTable(
  "app_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "restrict" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    active: boolean("active").notNull().default(true),
    /** Session revocation counter — compared to JWT claim. */
    authVersion: integer("auth_version").notNull().default(1),
    /** Nullable; upload UX deferred past M18. */
    profilePicture: text("profile_picture"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("app_users_company_email_lower_uidx").on(
      table.companyId,
      sql`lower(${table.email})`,
    ),
    index("app_users_company_active_idx").on(table.companyId, table.active),
    check(
      "app_users_email_normalized",
      sql`${table.email} = lower(${table.email})`,
    ),
  ],
);
