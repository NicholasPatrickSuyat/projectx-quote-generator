"use client";

/**
 * DEMO-ONLY authentication + user directory session.
 *
 * See `src/lib/auth/demo-auth.ts` for the security boundary.
 * Replace this provider with a real auth session later; keep
 * `capabilities` and feature UI gates stable.
 */

import {
  EMPTY_CAPABILITIES,
  capabilitiesForRole,
  type RoleCapabilities,
} from "@/lib/auth/capabilities";
import {
  normalizeEmail,
  readDemoAuthUserId,
  writeDemoAuthUserId,
} from "@/lib/auth/demo-auth";
import {
  getDemoCredentialMap,
  getDemoUsers,
} from "@/lib/users/demo-data";
import { createUser, setUserActive, updateUser } from "@/lib/users/mutations";
import {
  validateUserForm,
  wouldRemoveLastActiveAdmin,
  type UserFieldErrors,
} from "@/lib/users/validation";
import { startOfDay } from "@/lib/format";
import type { User, UserFormValues } from "@/types/user";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type DemoAuthSessionContextValue = {
  /** False until client has hydrated demo auth from sessionStorage. */
  ready: boolean;
  currentUser: User | null;
  users: User[];
  capabilities: RoleCapabilities;
  /**
   * DEMO-ONLY sign-in. Returns an error message on failure.
   * Never treat success as proof of production-grade security.
   */
  signIn: (email: string, password: string) => string | null;
  signOut: () => void;
  getUser: (id: string) => User | undefined;
  createUserAccount: (
    values: UserFormValues,
  ) => { user: User | null; errors: UserFieldErrors };
  updateUserAccount: (
    id: string,
    values: UserFormValues,
  ) => { user: User | null; errors: UserFieldErrors };
  setUserActiveState: (id: string, active: boolean) => string | null;
};

const DemoAuthSessionContext =
  createContext<DemoAuthSessionContextValue | null>(null);

function subscribeToNothing() {
  return () => {};
}

/** True only after client hydration — keeps SSR and first paint aligned. */
function useClientMounted(): boolean {
  return useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
}

export function DemoAuthSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const mounted = useClientMounted();
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  if (mounted && !seeded) {
    setSeeded(true);
    const today = startOfDay(new Date());
    const seedUsers = getDemoUsers(today);
    setUsers(seedUsers);
    setCredentials(getDemoCredentialMap());
    const storedId = readDemoAuthUserId();
    if (
      storedId &&
      seedUsers.some((user) => user.id === storedId && user.active)
    ) {
      setCurrentUserId(storedId);
    } else {
      writeDemoAuthUserId(null);
      setCurrentUserId(null);
    }
  }

  const value = useMemo<DemoAuthSessionContextValue>(() => {
    const currentUser =
      currentUserId == null
        ? null
        : (users.find((user) => user.id === currentUserId && user.active) ??
          null);

    const capabilities = currentUser
      ? capabilitiesForRole(currentUser.role)
      : EMPTY_CAPABILITIES;

    function getUser(id: string) {
      return users.find((user) => user.id === id);
    }

    function signIn(email: string, password: string): string | null {
      const key = normalizeEmail(email);
      const user = users.find((item) => normalizeEmail(item.email) === key);
      if (!user) {
        return "Invalid email or password.";
      }
      if (!user.active) {
        return "This account is inactive. Contact an Admin.";
      }
      const expected = credentials[key];
      if (!expected || expected !== password) {
        return "Invalid email or password.";
      }
      setCurrentUserId(user.id);
      writeDemoAuthUserId(user.id);
      return null;
    }

    function signOut() {
      setCurrentUserId(null);
      writeDemoAuthUserId(null);
    }

    function createUserAccount(values: UserFormValues): {
      user: User | null;
      errors: UserFieldErrors;
    } {
      if (!capabilities.canManageUsers) {
        return {
          user: null,
          errors: { form: "You do not have permission to manage users." },
        };
      }
      const errors = validateUserForm(values, users, { mode: "create" });
      if (Object.keys(errors).length > 0) {
        return { user: null, errors };
      }
      const today = startOfDay(new Date());
      const created = createUser(users, values, today);
      const key = normalizeEmail(created.email);
      setUsers((prev) => [created, ...prev]);
      setCredentials((prev) => ({
        ...prev,
        [key]: values.demoPassword,
      }));
      return { user: created, errors: {} };
    }

    function updateUserAccount(
      id: string,
      values: UserFormValues,
    ): { user: User | null; errors: UserFieldErrors } {
      if (!capabilities.canManageUsers) {
        return {
          user: null,
          errors: { form: "You do not have permission to manage users." },
        };
      }
      const existing = users.find((user) => user.id === id);
      if (!existing) {
        return { user: null, errors: { form: "User not found." } };
      }
      const errors = validateUserForm(values, users, {
        mode: "edit",
        userId: id,
      });
      if (Object.keys(errors).length > 0) {
        return { user: null, errors };
      }

      const today = startOfDay(new Date());
      const previousKey = normalizeEmail(existing.email);
      const updated = updateUser(existing, values, today);
      const nextKey = normalizeEmail(updated.email);

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? updated : user)),
      );
      setCredentials((prev) => {
        const next = { ...prev };
        const password =
          values.demoPassword.trim().length > 0
            ? values.demoPassword
            : next[previousKey];
        if (previousKey !== nextKey) {
          delete next[previousKey];
        }
        if (password) {
          next[nextKey] = password;
        }
        return next;
      });

      if (currentUserId === id && !updated.active) {
        signOut();
      }

      return { user: updated, errors: {} };
    }

    function setUserActiveState(id: string, active: boolean): string | null {
      if (!capabilities.canManageUsers) {
        return "You do not have permission to manage users.";
      }
      const today = startOfDay(new Date());
      const target = users.find((user) => user.id === id);
      if (
        target &&
        wouldRemoveLastActiveAdmin(users, id, {
          role: target.role,
          active,
        })
      ) {
        return "The application must keep at least one active Admin.";
      }
      const result = setUserActive(users, id, active, today);
      if (result.error) return result.error;
      setUsers(result.users);
      if (currentUserId === id && !active) {
        signOut();
      }
      return null;
    }

    return {
      ready: seeded,
      currentUser,
      users,
      capabilities,
      signIn,
      signOut,
      getUser,
      createUserAccount,
      updateUserAccount,
      setUserActiveState,
    };
  }, [users, credentials, currentUserId, seeded]);

  return (
    <DemoAuthSessionContext.Provider value={value}>
      {children}
    </DemoAuthSessionContext.Provider>
  );
}

export function useDemoAuthSession(): DemoAuthSessionContextValue {
  const ctx = useContext(DemoAuthSessionContext);
  if (!ctx) {
    throw new Error(
      "useDemoAuthSession must be used within DemoAuthSessionProvider",
    );
  }
  return ctx;
}
