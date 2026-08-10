import { RequireAuth } from "@/components/auth/require-auth";
import { AppShell } from "@/components/layout/app-shell";
import { SessionProviders } from "@/components/session/session-providers";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RequireAuth>
      <SessionProviders>
        <AppShell>{children}</AppShell>
      </SessionProviders>
    </RequireAuth>
  );
}
