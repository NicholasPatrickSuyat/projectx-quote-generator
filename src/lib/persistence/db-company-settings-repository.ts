import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { company, companySettings } from "@/lib/db/schema";
import {
  companyLogoToLogoJson,
  settingsRowToDomain,
} from "@/lib/persistence/mappers";
import type { CompanySettingsRepository } from "@/lib/persistence/ports";
import { validateCompanySettingsForm } from "@/lib/company/validation";
import { assertServerModule } from "@/lib/server-module";
import type {
  CompanySettings,
  CompanySettingsFormValues,
} from "@/types/company";

assertServerModule("@/lib/persistence/db-company-settings-repository");

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

export function createDbCompanySettingsRepository(): CompanySettingsRepository {
  return {
    async get(): Promise<CompanySettings> {
      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const rows = await db
        .select()
        .from(companySettings)
        .where(eq(companySettings.companyId, companyId))
        .limit(1);
      if (rows.length === 0) {
        throw new Error(
          "No company_settings row found. Run npm run db:bootstrap:company first.",
        );
      }
      return settingsRowToDomain(rows[0]);
    },

    async save(values: CompanySettingsFormValues): Promise<CompanySettings> {
      const errors = validateCompanySettingsForm(values);
      if (Object.keys(errors).length > 0) {
        const first = Object.values(errors)[0] ?? "Invalid settings.";
        throw new Error(first);
      }

      const db = getDb();
      const companyId = await requireSingletonCompanyId();
      const now = new Date();

      const payload = {
        companyName: values.companyName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        website: values.website.trim(),
        street: values.street.trim(),
        city: values.city.trim(),
        state: values.state.trim().toUpperCase(),
        zip: values.zip.trim(),
        logoJson: companyLogoToLogoJson(values.logo),
        currency: "USD" as const,
        taxRate: String(values.taxRate),
        quoteValidityDays: values.quoteValidityDays,
        discountType: values.discountType,
        discountValue: String(values.discountValue),
        preparedBy: values.preparedBy.trim(),
        customerFacingMessage: values.customerFacingMessage.trim(),
        termsAndConditions: values.termsAndConditions.trim(),
        pdfFooterText: values.pdfFooterText.trim(),
        updatedAt: now,
      };

      const updated = await db
        .update(companySettings)
        .set(payload)
        .where(eq(companySettings.companyId, companyId))
        .returning();

      if (updated.length === 0) {
        throw new Error("Failed to update company settings.");
      }

      await db
        .update(company)
        .set({ name: payload.companyName, updatedAt: now })
        .where(eq(company.id, companyId));

      return settingsRowToDomain(updated[0]);
    },
  };
}
