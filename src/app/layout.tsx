import { AuthRootProvider } from "@/components/session/auth-root-provider";
import { getAuthMode } from "@/lib/auth/mode";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Quote Generator Pro",
    template: "%s · Quote Generator Pro",
  },
  description:
    "Professional quote generation for service businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authMode = getAuthMode();

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthRootProvider mode={authMode}>{children}</AuthRootProvider>
      </body>
    </html>
  );
}
