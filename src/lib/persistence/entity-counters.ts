/**
 * Atomic per-company business number allocation (CUST-###### / QUO-######).
 * Must run on the same transaction client as the create insert.
 */

import { and, eq, sql } from "drizzle-orm";
import type { AppDatabase } from "@/lib/db/client";
import { entityCounters } from "@/lib/db/schema";
import {
  formatCustomerNumber,
  formatQuoteNumber,
  type EntityCounterType,
} from "@/lib/persistence/numbering";
import { assertServerModule } from "@/lib/server-module";

assertServerModule("@/lib/persistence/entity-counters");

export type DbTransaction = Parameters<
  Parameters<AppDatabase["transaction"]>[0]
>[0];

/**
 * Allocate the next customer or quote business number inside an open transaction.
 * Inserts the counter row at next_value=1 when missing, then atomically
 * increments and returns the previous value formatted as CUST-/QUO-######.
 */
export async function allocateNextBusinessNumber(
  tx: DbTransaction,
  companyId: string,
  entityType: EntityCounterType,
): Promise<string> {
  await tx
    .insert(entityCounters)
    .values({
      companyId,
      entityType,
      nextValue: 1,
      updatedAt: new Date(),
    })
    .onConflictDoNothing({
      target: [entityCounters.companyId, entityCounters.entityType],
    });

  const rows = await tx
    .update(entityCounters)
    .set({
      nextValue: sql`${entityCounters.nextValue} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(entityCounters.companyId, companyId),
        eq(entityCounters.entityType, entityType),
      ),
    )
    .returning({ nextValue: entityCounters.nextValue });

  const nextValue = rows[0]?.nextValue;
  if (nextValue == null || !Number.isInteger(nextValue) || nextValue < 2) {
    throw new Error(
      `Failed to allocate ${entityType} number for company ${companyId}.`,
    );
  }

  const allocated = nextValue - 1;
  return entityType === "customer"
    ? formatCustomerNumber(allocated)
    : formatQuoteNumber(allocated);
}
