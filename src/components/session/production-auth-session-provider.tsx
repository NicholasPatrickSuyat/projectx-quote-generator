"use client";

/**
 * Production Auth.js session + database-backed Users management (M18).
 * Client capabilities are UX-only; mutations go through authorized Server Actions.
 */

import {
  AuthSessionContextProvider,
  type AuthSessionContextValue,
} from "@/components/session/auth-session-context";
import {
  EMPTY_CAPABILITIES,
  capabilitiesForRole,
} from "@/lib/auth/capabilities";
import { GENERIC_INVALID_LOGIN } from "@/lib/auth/password";
import {
  createUserInDb,
  loadManagedUsersAction,
  setUserActiveInDb,
  updateUserInDb,
} from "@/lib/actions/users";
import type { User, UserFormValues } from "@/types/user";
import {
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
  useSession,
} from "next-auth/react";
import {
  useCallback,
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

export function ProductionAuthSessionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const mounted = useClientMounted();
  const [users, setUsers] = useState<User[]>([]);
  const [usersEpoch, setUsersEpoch] = useState<string>("boot");
  const [loadInFlight, setLoadInFlight] = useState(false);

  const currentUser = useMemo<User | null>(() => {
    if (session?.error === "SessionInvalid") return null;
    const sessionUser = session?.user;
    if (!sessionUser?.id) return null;
    return {
      id: sessionUser.id,
      fullName: sessionUser.fullName,
      email: sessionUser.email,
      role: sessionUser.role,
      active: true,
      profilePicture: null,
      createdAt: "",
      updatedAt: "",
    };
  }, [session?.user, session?.error]);

  const capabilities = currentUser
    ? capabilitiesForRole(currentUser.role)
    : EMPTY_CAPABILITIES;

  const sessionInvalid = session?.error === "SessionInvalid";
  const effectiveStatus =
    sessionInvalid || !currentUser
      ? status === "loading"
        ? "loading"
        : "unauthenticated"
      : status;

  const authEpoch =
    effectiveStatus === "loading"
      ? "loading"
      : effectiveStatus === "unauthenticated"
        ? "signed-out"
        : currentUser
          ? `user:${currentUser.id}:manage:${capabilities.canManageUsers ? "1" : "0"}`
          : "signed-out";

  if (
    mounted &&
    authEpoch !== "loading" &&
    usersEpoch !== authEpoch &&
    !loadInFlight
  ) {
    if (authEpoch === "signed-out" || !capabilities.canManageUsers) {
      setUsersEpoch(authEpoch);
      setUsers([]);
    } else {
      setLoadInFlight(true);
      const epoch = authEpoch;
      void loadManagedUsersAction()
        .then((result) => {
          setUsers(result.users);
          setUsersEpoch(epoch);
        })
        .finally(() => {
          setLoadInFlight(false);
        });
    }
  }

  const usersReady =
    effectiveStatus !== "loading" &&
    !loadInFlight &&
    usersEpoch === authEpoch;

  const refreshUsers = useCallback(async () => {
    if (!capabilities.canManageUsers) {
      setUsers([]);
      return;
    }
    const result = await loadManagedUsersAction();
    setUsers(result.users);
  }, [capabilities.canManageUsers]);

  const value = useMemo<AuthSessionContextValue>(() => {
    function getUser(id: string) {
      return users.find((user) => user.id === id);
    }

    async function signIn(
      email: string,
      password: string,
    ): Promise<string | null> {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!result || result.error) {
        return GENERIC_INVALID_LOGIN;
      }
      return null;
    }

    async function signOut() {
      await nextAuthSignOut({ redirect: false });
      setUsers([]);
      setUsersEpoch("signed-out");
      setLoadInFlight(false);
    }

    async function createUserAccount(values: UserFormValues) {
      const result = await createUserInDb(values);
      if (result.user) {
        await refreshUsers();
      }
      return result;
    }

    async function updateUserAccount(id: string, values: UserFormValues) {
      const result = await updateUserInDb(id, values);
      if (result.user) {
        await refreshUsers();
        if (currentUser?.id === id && !result.user.active) {
          await signOut();
        }
      }
      return result;
    }

    async function setUserActiveState(id: string, active: boolean) {
      const result = await setUserActiveInDb(id, active);
      if (result.error) return result.error;
      await refreshUsers();
      if (currentUser?.id === id && !active) {
        await signOut();
      }
      return null;
    }

    return {
      ready: usersReady,
      authMode: "production",
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
  }, [usersReady, currentUser, users, capabilities, refreshUsers]);

  return (
    <AuthSessionContextProvider value={value}>
      {children}
    </AuthSessionContextProvider>
  );
}
