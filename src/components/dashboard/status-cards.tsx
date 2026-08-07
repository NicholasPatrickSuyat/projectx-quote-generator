import { STATUS_META } from "@/lib/dashboard/status-meta";
import type { StatusCounts } from "@/lib/dashboard/metrics";
import { QUOTE_STATUSES } from "@/types/quote";
import Link from "next/link";

type StatusCardsProps = {
  counts: StatusCounts;
};

export function StatusCards({ counts }: StatusCardsProps) {
  return (
    <section aria-labelledby="status-cards-heading" className="space-y-4">
      <h2
        id="status-cards-heading"
        className="text-xs font-semibold tracking-wider text-text-secondary uppercase"
      >
        Quote Status
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {QUOTE_STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const Icon = meta.icon;
          return (
            <Link
              key={status}
              href={meta.href}
              className="group relative rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 pb-5 shadow-sm transition-[border-color,background-color,box-shadow] duration-150 hover:border-border-strong hover:bg-bg-muted hover:shadow-md focus-visible:border-primary-hover focus-visible:bg-primary-subtle focus-visible:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover active:bg-bg-muted"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-[var(--radius-md)] transition-transform duration-150 group-hover:scale-[1.03] group-focus-visible:scale-[1.03] ${meta.cardClass}`}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-2xl font-semibold tracking-tight tabular-nums text-text-primary">
                  {counts[status]}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-text-secondary transition-colors duration-150 group-hover:text-text-primary group-focus-visible:text-text-primary">
                {meta.label}
              </p>
              <span className="pointer-events-none absolute inset-x-4 bottom-2.5 text-xs font-medium text-primary opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                View quotes
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
