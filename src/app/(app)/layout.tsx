import { AppShell } from "@/components/layout/app-shell";
import { SessionProviders } from "@/components/session/session-providers";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProviders>
      <AppShell>{children}</AppShell>
    </SessionProviders>
  );
}
