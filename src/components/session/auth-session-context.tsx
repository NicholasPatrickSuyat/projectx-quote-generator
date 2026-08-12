"use client";

import type { RoleCapabilities } from "@/lib/auth/capabilities";
import type { UserFieldErrors } from "@/lib/users/validation";
import type { User, UserFormValues } from "@/types/user";
import { createContext, useContext, type ReactNode } from "react";

/**
 * Shared auth session surface for demo and production providers.
 * Client capabilities are UX-only; server derives them independently.
 */
export type AuthSessionContextValue = {
  ready: boolean;
  authMode: "demo" | "production";
  currentUser: User | null;
  users: User[];
  capabilities: RoleCapabilities;
  /** Returns an error message on failure; null on success. */
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  getUser: (id: string) => User | undefined;
  createUserAccount: (
    values: UserFormValues,
  ) => Promise<{ user: User | null; errors: UserFieldErrors }>;
  updateUserAccount: (
    id: string,
    values: UserFormValues,
  ) => Promise<{ user: User | null; errors: UserFieldErrors }>;
  setUserActiveState: (id: string, active: boolean) => Promise<string | null>;
};

export const AuthSessionContext =
  createContext<AuthSessionContextValue | null>(null);

export function AuthSessionContextProvider({
  value,
  children,
}: {
  value: AuthSessionContextValue;
  children: ReactNode;
}) {
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession(): AuthSessionContextValue {
  const ctx = useContext(AuthSessionContext);
  if (!ctx) {
    throw new Error("useAuthSession must be used within an auth session provider");
  }
  return ctx;
}

/** @deprecated Prefer useAuthSession — alias retained during M18 migration. */
export function useDemoAuthSession(): AuthSessionContextValue {
  return useAuthSession();
}
