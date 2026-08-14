import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { validateCustomerForm } from "@/lib/customers/filters";
import { allocateNextBusinessNumber } from "@/lib/persistence/entity-counters";
import {
  customerRowToDomain,
  toCustomerInsert,
} from "@/lib/persistence/mappers";
import type { CustomerRepository } from "@/lib/persistence/ports";
import { assertServerModule } from "@/lib/server-module";
import type { Customer, CustomerFormValues } from "@/types/customer";

assertServerModule("@/lib/persistence/db-customers-repository");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertValidCustomerValues(values: CustomerFormValues): void {
  const errors = validateCustomerForm(values);
  const first = Object.values(errors)[0];
  if (first) throw new Error(first);
}

function resolveCustomerId(candidate: string | undefined): string {
  if (candidate && UUID_RE.test(candidate)) return candidate;
  return crypto.randomUUID();
}

/**
 * Company-scoped durable customers.
 * Pass companyId from AuthorizedUser in production; singleton company for demo hybrid reads.
 */
export function createDbCustomersRepository(
  companyId: string,
): CustomerRepository {
  return {
    async list(): Promise<Customer[]> {
      const db = getDb();
      const rows = await db
        .select()
        .from(customers)
        .where(eq(customers.companyId, companyId))
        .orderBy(asc(customers.lastName), asc(customers.firstName));
      return rows.map(customerRowToDomain);
    },

    async get(id: string): Promise<Customer | undefined> {
      const db = getDb();
      const rows = await db
        .select()
        .from(customers)
        .where(and(eq(customers.companyId, companyId), eq(customers.id, id)))
        .limit(1);
      return rows[0] ? customerRowToDomain(rows[0]) : undefined;
    },

    async getByNumber(customerNumber: string): Promise<Customer | undefined> {
      const db = getDb();
      const rows = await db
        .select()
        .from(customers)
        .where(
          and(
            eq(customers.companyId, companyId),
            eq(customers.customerNumber, customerNumber),
          ),
        )
        .limit(1);
      return rows[0] ? customerRowToDomain(rows[0]) : undefined;
    },

    async create(
      values: CustomerFormValues,
      options?: { id?: string },
    ): Promise<Customer> {
      assertValidCustomerValues(values);
      const db = getDb();
      const id = resolveCustomerId(options?.id);
      const now = new Date();

      const inserted = await db.transaction(async (tx) => {
        const customerNumber = await allocateNextBusinessNumber(
          tx,
          companyId,
          "customer",
        );
        const rows = await tx
          .insert(customers)
          .values(toCustomerInsert(values, companyId, customerNumber, id, now))
          .returning();
        return rows[0];
      });

      return customerRowToDomain(inserted);
    },

    async update(
      id: string,
      values: CustomerFormValues,
    ): Promise<Customer | null> {
      assertValidCustomerValues(values);
      const db = getDb();
      const now = new Date();
      const rows = await db
        .update(customers)
        .set({
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          companyName: values.companyName.trim() || null,
          phone: values.phone.trim(),
          email: values.email.trim(),
          street: values.street.trim(),
          city: values.city.trim(),
          state: values.state.trim(),
          zip: values.zip.trim(),
          internalNotes: values.internalNotes.trim(),
          updatedAt: now,
        })
        .where(and(eq(customers.companyId, companyId), eq(customers.id, id)))
        .returning();
      // Does not rewrite quote customer_snapshot (D6).
      return rows[0] ? customerRowToDomain(rows[0]) : null;
    },

    async archive(id: string): Promise<void> {
      const current = await this.get(id);
      if (!current || current.archived) return;
      const db = getDb();
      const now = new Date();
      await db
        .update(customers)
        .set({
          archived: true,
          archivedAt: now,
          updatedAt: now,
        })
        .where(and(eq(customers.companyId, companyId), eq(customers.id, id)));
    },

    async restore(id: string): Promise<void> {
      const current = await this.get(id);
      if (!current || !current.archived) return;
      const db = getDb();
      await db
        .update(customers)
        .set({
          archived: false,
          archivedAt: null,
          updatedAt: new Date(),
        })
        .where(and(eq(customers.companyId, companyId), eq(customers.id, id)));
    },
  };
}
