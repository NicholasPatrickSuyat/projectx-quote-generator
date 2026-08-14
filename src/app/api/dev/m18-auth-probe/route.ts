/**
 * Development-only auth guard probe (M18 E2E).
 *
 * Enabled only when:
 *   APP_ENV=development (or inferred) AND M18_AUTH_PROBE=1
 *
 * GET  — unauthenticated durable action probes
 * POST — authenticated capability probes (forwards session cookie)
 *
 * Never enable on Vercel production/preview.
 */

import { auth } from "@/auth";
import {
  createCatalogItemInDb,
  loadCatalogFromDb,
  loadCompanySettingsFromDb,
  saveCompanySettingsToDb,
} from "@/lib/actions/persistence";
import {
  createUserInDb,
  listUsersFromDb,
} from "@/lib/actions/users";
import {
  AuthorizationError,
  requireActiveUser,
  requireCapability,
} from "@/lib/auth/session";
import { getAuthMode } from "@/lib/auth/mode";
import { getAppEnv } from "@/lib/persistence/mode";
import { capabilitiesForRole } from "@/lib/auth/capabilities";

export const dynamic = "force-dynamic";

function probeEnabled(): boolean {
  if (process.env.M18_AUTH_PROBE !== "1") return false;
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    return false;
  }
  if ((process.env.APP_ENV ?? "").trim().toLowerCase() === "production") {
    return false;
  }
  if ((process.env.AUTH_MODE ?? "").trim().toLowerCase() === "production" &&
      (process.env.APP_ENV ?? "").trim().toLowerCase() === "production") {
    return false;
  }
  return getAppEnv() === "development";
}

async function outcome(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    return { label, result: "allowed" as const };
  } catch (error) {
    return {
      label,
      result: "denied" as const,
      code:
        error instanceof Error && "code" in error
          ? String((error as { code?: string }).code ?? "")
          : "",
      message: error instanceof Error ? error.message.slice(0, 160) : "error",
    };
  }
}

export async function GET() {
  if (!probeEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const results = [
    await outcome("settingsRead", () => loadCompanySettingsFromDb()),
    await outcome("settingsWrite", () =>
      saveCompanySettingsToDb({
        companyName: "Probe",
        phone: "0",
        email: "probe@example.com",
        website: "",
        street: "1",
        city: "X",
        state: "TX",
        zip: "00000",
        logo: null,
        currency: "USD",
        taxRate: 0,
        quoteValidityDays: 30,
        discountType: "none",
        discountValue: 0,
        preparedBy: "",
        customerFacingMessage: "x",
        termsAndConditions: "x",
        pdfFooterText: "x",
      }),
    ),
    await outcome("catalogRead", () => loadCatalogFromDb()),
    await outcome("catalogCreate", () =>
      createCatalogItemInDb({
        name: "Probe Item",
        category: "Labor",
        unit: "ea",
        unitPrice: 1,
        description: "probe",
      }),
    ),
    await outcome("usersRead", () => listUsersFromDb()),
    await outcome("usersCreate", async () => {
      const result = await createUserInDb({
        fullName: "Probe User",
        email: "probe.user@example.com",
        role: "Office Staff",
        active: true,
        password: "ProbePassword12",
      });
      if (result.user) return result.user;
      throw new Error(result.errors.form || "User create denied");
    }),
  ];

  return Response.json({
    authMode: getAuthMode(),
    appEnv: getAppEnv(),
    results,
  });
}

/** Authenticated capability matrix probe (cookie session required). */
export async function POST(request: Request) {
  if (!probeEnabled()) {
    return new Response("Not found", { status: 404 });
  }

  const session = await auth();
  const url = new URL(request.url);
  const persistSmoke = url.searchParams.get("persistSmoke") === "1";

  const results = [
    await outcome("sessionPresent", async () => {
      if (!session?.user?.id || session.error === "SessionInvalid") {
        throw new AuthorizationError("UNAUTHENTICATED", "no session");
      }
    }),
    await outcome("activeUser", () => requireActiveUser()),
    await outcome("catalogReadAsUser", () => loadCatalogFromDb()),
    await outcome("settingsReadAsUser", () => loadCompanySettingsFromDb()),
    await outcome("settingsWriteAsUser", () =>
      requireCapability("canManageSettings"),
    ),
    await outcome("catalogManageAsUser", () =>
      requireCapability("canManageCatalog"),
    ),
    await outcome("usersManageAsUser", () =>
      requireCapability("canManageUsers"),
    ),
    await outcome("usersListAsUser", () => listUsersFromDb()),
  ];

  if (persistSmoke) {
    results.push(
      await outcome("settingsPersistRoundTrip", async () => {
        await requireCapability("canManageSettings");
        const current = await loadCompanySettingsFromDb();
        const marker = `m18-${Date.now()}`;
        const saved = await saveCompanySettingsToDb({
          ...current,
          preparedBy: marker,
        });
        if (saved.preparedBy !== marker) {
          throw new Error("settings save marker mismatch");
        }
        const reloaded = await loadCompanySettingsFromDb();
        if (reloaded.preparedBy !== marker) {
          throw new Error("settings reload marker mismatch");
        }
        // restore prior preparedBy
        await saveCompanySettingsToDb({
          ...current,
          preparedBy: current.preparedBy,
        });
      }),
      await outcome("catalogPersistRoundTrip", async () => {
        await requireCapability("canManageCatalog");
        const created = await createCatalogItemInDb({
          name: `M18 Probe ${Date.now()}`,
          category: "Labor",
          unit: "ea",
          unitPrice: 12.5,
          description: "m18 persistence probe",
        });
        const listed = await loadCatalogFromDb();
        if (!listed.some((item) => item.id === created.id)) {
          throw new Error("created catalog item missing from list");
        }
        const { archiveCatalogItemInDb, restoreCatalogItemInDb, updateCatalogItemInDb } =
          await import("@/lib/actions/persistence");
        await updateCatalogItemInDb(created.id, {
          name: created.name + " Edited",
          category: created.category,
          unit: created.unit,
          unitPrice: created.unitPrice,
          description: created.description,
        });
        await archiveCatalogItemInDb(created.id);
        await restoreCatalogItemInDb(created.id);
      }),
    );
  }

  const role = session?.user?.role;
  return Response.json({
    authMode: getAuthMode(),
    role: role ?? null,
    capabilities: role ? capabilitiesForRole(role) : null,
    results,
  });
}
