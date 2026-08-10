import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col bg-bg-app">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklab, var(--color-primary) 18%, transparent), transparent)",
        }}
      />
      <main className="relative flex flex-1 items-center justify-center px-4 py-12">
        <Suspense
          fallback={
            <p className="text-sm text-text-secondary">Loading…</p>
          }
        >
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
