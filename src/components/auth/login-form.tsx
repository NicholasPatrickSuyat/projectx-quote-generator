"use client";

import { Button } from "@/components/ui/button";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { useAuthSession } from "@/components/session/auth-session-context";
import {
  DEMO_ADMIN_EMAIL,
  DEMO_STAFF_EMAIL,
} from "@/lib/auth/demo-auth";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import { APP_NAME, DEMO_COMPANY_NAME } from "@/lib/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

/**
 * Login form — demo (client credential map) or production (Auth.js Credentials).
 */
export function LoginForm() {
  const { ready, currentUser, signIn, authMode } = useAuthSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeNext = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && currentUser) {
      router.replace(safeNext);
    }
  }, [ready, currentUser, router, safeNext]);

  if (!ready || currentUser) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" aria-busy>
        <p className="text-sm text-text-secondary">Loading…</p>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    const message = await signIn(email, password);
    setSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    router.replace(safeNext);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold tracking-wide text-primary uppercase">
          {APP_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          {DEMO_COMPANY_NAME}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-6 shadow-sm"
        noValidate
      >
        {authMode === "demo" ? (
          <p className="mb-4 rounded-[var(--radius-md)] border border-border-default bg-bg-muted/60 px-3 py-2 text-xs text-text-secondary">
            Demo authentication only — not production security. Credentials are
            checked in this browser session.
          </p>
        ) : (
          <p className="mb-4 rounded-[var(--radius-md)] border border-border-default bg-bg-muted/60 px-3 py-2 text-xs text-text-secondary">
            Sign in with your organization account.
          </p>
        )}

        <div className="space-y-4">
          <FormField id="login-email" label="Email" required>
            <Input
              {...fieldControlProps("login-email", error ?? undefined)}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>
          <FormField id="login-password" label="Password" required>
            <Input
              {...fieldControlProps("login-password", error ?? undefined)}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </FormField>
        </div>

        {error ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className="mt-6 w-full"
          disabled={submitting}
        >
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {authMode === "demo" ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-border-default bg-bg-surface/80 px-4 py-3 text-xs text-text-secondary">
          <p className="font-medium text-text-primary">Demo accounts</p>
          <ul className="mt-2 space-y-1">
            <li>
              Admin: {DEMO_ADMIN_EMAIL} / DemoAdmin!23
            </li>
            <li>
              Office Staff: {DEMO_STAFF_EMAIL} / DemoStaff!23
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
