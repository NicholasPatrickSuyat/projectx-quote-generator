import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Neon-backed login rate limits (M20).
 * dimension: "email" | "ip"
 * keyHash: sha256(normalized email) or canonical IP string
 */
export const loginRateLimits = pgTable(
  "login_rate_limits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dimension: text("dimension").notNull(),
    keyHash: text("key_hash").notNull(),
    attemptCount: integer("attempt_count").notNull().default(0),
    windowStartedAt: timestamp("window_started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("login_rate_limits_dimension_key_uidx").on(
      table.dimension,
      table.keyHash,
    ),
    index("login_rate_limits_updated_at_idx").on(table.updatedAt),
  ],
);
