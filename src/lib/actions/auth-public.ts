"use server";

import { getAuthMode, type AuthMode } from "@/lib/auth/mode";
import { getPersistenceMode } from "@/lib/persistence/mode";

export type AuthPublicInfo = {
  authMode: AuthMode;
  persistenceMode: "session" | "database";
};

export async function getAuthPublicInfo(): Promise<AuthPublicInfo> {
  return {
    authMode: getAuthMode(),
    persistenceMode: getPersistenceMode(),
  };
}
