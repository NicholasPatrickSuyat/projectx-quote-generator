"use server";

import {
  assertCanMutateCustomersInDatabase,
  assertCanReadCustomersFromDatabase,
  assertCanRestoreCustomerInDatabase,
} from "@/lib/auth/assert-capability";
import {
  requireDatabaseCustomerMutation,
  requireDatabaseCustomersRead,
} from "@/lib/auth/session";
import { getDb } from "@/lib/db/client";
import { company } from "@/lib/db/schema";
import { createDbCustomersRepository } from "@/lib/persistence/db-customers-repository";
import type { Customer, CustomerFormValues } from "@/types/customer";

async function requireSingletonCompanyId(): Promise<string> {
  const db = getDb();
  const rows = await db.select({ id: company.id }).from(company).limit(2);
  if (rows.length === 0) {
    throw new Error(
      "No company row found. Run npm run db:bootstrap:company first.",
    );
  }
  if (rows.length > 1) {
    throw new Error(
      "Multiple company rows found. M17 expects a single-company installation.",
    );
  }
  return rows[0].id;
}

async function resolveReadCompanyId(): Promise<string> {
  const user = await requireDatabaseCustomersRead();
  if (user) return user.companyId;
  return requireSingletonCompanyId();
}

export async function loadCustomersFromDb(): Promise<Customer[]> {
  await assertCanReadCustomersFromDatabase();
  const companyId = await resolveReadCompanyId();
  return createDbCustomersRepository(companyId).list();
}

export async function getCustomerFromDb(
  id: string,
): Promise<Customer | undefined> {
  await assertCanReadCustomersFromDatabase();
  const companyId = await resolveReadCompanyId();
  return createDbCustomersRepository(companyId).get(id);
}

export async function getCustomerByNumberFromDb(
  customerNumber: string,
): Promise<Customer | undefined> {
  await assertCanReadCustomersFromDatabase();
  const companyId = await resolveReadCompanyId();
  return createDbCustomersRepository(companyId).getByNumber(customerNumber);
}

export async function createCustomerInDb(
  values: CustomerFormValues,
  options?: { id?: string },
): Promise<Customer> {
  await assertCanMutateCustomersInDatabase();
  const { user } = await requireDatabaseCustomerMutation();
  return createDbCustomersRepository(user.companyId).create(values, options);
}

export async function updateCustomerInDb(
  id: string,
  values: CustomerFormValues,
): Promise<Customer | null> {
  await assertCanMutateCustomersInDatabase();
  const { user } = await requireDatabaseCustomerMutation();
  return createDbCustomersRepository(user.companyId).update(id, values);
}

export async function archiveCustomerInDb(id: string): Promise<void> {
  await assertCanMutateCustomersInDatabase();
  const { user } = await requireDatabaseCustomerMutation();
  return createDbCustomersRepository(user.companyId).archive(id);
}

export async function restoreCustomerInDb(id: string): Promise<void> {
  await assertCanRestoreCustomerInDatabase();
  const { user } = await requireDatabaseCustomerMutation();
  return createDbCustomersRepository(user.companyId).restore(id);
}
