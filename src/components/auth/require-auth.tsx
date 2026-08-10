"use client";

import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

type RequireAuthProps = {
  children: ReactNode;
};

/**
 * Client gate for protected app routes.
 * DEMO-ONLY — not production security. Prevents casual access and UI flash.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { ready, currentUser } = useDemoAuthSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      const search =
        typeof window !== "undefined" ? window.location.search : "";
      const target = `${pathname || "/"}${search}`;
      router.replace(`/login?next=${encodeURIComponent(target)}`);
    }
  }, [ready, currentUser, router, pathname]);

  if (!ready || !currentUser) {
    return (
      <div
        className="flex min-h-full items-center justify-center bg-bg-app"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
          <p className="text-sm text-text-secondary">Loading session…</p>
        </div>
      </div>
    );
  }

  return children;
}

type RequireCapabilityProps = {
  allowed: boolean;
  children: ReactNode;
  /** Where to send unauthorized authenticated users. */
  fallbackHref?: string;
};

/** Hide Admin-only routes. DEMO client gate only. */
export function RequireCapability({
  allowed,
  children,
  fallbackHref = "/",
}: RequireCapabilityProps) {
  const { ready, currentUser } = useDemoAuthSession();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !currentUser) return;
    if (!allowed) {
      router.replace(fallbackHref);
    }
  }, [ready, currentUser, allowed, router, fallbackHref]);

  if (!ready || !currentUser || !allowed) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        aria-busy="true"
      >
        <p className="text-sm text-text-secondary">Checking access…</p>
      </div>
    );
  }

  return children;
}
