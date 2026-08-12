"use client";

/**
 * DEMO-ONLY authentication + user directory session.
 *
 * See `src/lib/auth/demo-auth.ts` for the security boundary.
 * Used only when AUTH_MODE=demo.
 */

import {
  AuthSessionContextProvider,
  type AuthSessionContextValue,
} from "@/components/session/auth-session-context";
import {
  EMPTY_CAPABILITIES,
  capabilitiesForRole,
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
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

function subscribeToNothing() {
  return () => {};
}

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

  const value = useMemo<AuthSessionContextValue>(() => {
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

    async function signIn(email: string, password: string): Promise<string | null> {
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

    async function signOut() {
      setCurrentUserId(null);
      writeDemoAuthUserId(null);
    }

    async function createUserAccount(values: UserFormValues): Promise<{
      user: User | null;
      errors: UserFieldErrors;
    }> {
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
        [key]: values.password,
      }));
      return { user: created, errors: {} };
    }

    async function updateUserAccount(
      id: string,
      values: UserFormValues,
    ): Promise<{ user: User | null; errors: UserFieldErrors }> {
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
          values.password.trim().length > 0
            ? values.password
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
        await signOut();
      }

      return { user: updated, errors: {} };
    }

    async function setUserActiveState(
      id: string,
      active: boolean,
    ): Promise<string | null> {
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
        await signOut();
      }
      return null;
    }

    return {
      ready: seeded,
      authMode: "demo",
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
    <AuthSessionContextProvider value={value}>
      {children}
    </AuthSessionContextProvider>
  );
}

export {
  useAuthSession,
  useDemoAuthSession,
} from "@/components/session/auth-session-context";
