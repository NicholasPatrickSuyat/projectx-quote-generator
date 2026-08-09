import { NewQuotePageContent } from "@/components/quotes/builder/quote-builder-view";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "New Quote",
};

export default function NewQuotePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <div className="h-10 w-48 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
          <div className="h-96 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
        </div>
      }
    >
      <NewQuotePageContent />
    </Suspense>
  );
}
