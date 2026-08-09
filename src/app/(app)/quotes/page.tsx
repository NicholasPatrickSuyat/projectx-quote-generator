import { QuotesView } from "@/components/quotes/quotes-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Quotes",
};

export default function QuotesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <div className="h-10 w-48 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
          <div className="h-10 w-full animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
          <div className="h-72 w-full animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
        </div>
      }
    >
      <QuotesView />
    </Suspense>
  );
}
