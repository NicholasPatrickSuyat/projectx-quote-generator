import { STATUS_META } from "@/lib/dashboard/status-meta";
import type { StatusCounts } from "@/lib/dashboard/metrics";
import { QUOTE_STATUSES } from "@/types/quote";

type StatusChartProps = {
  counts: StatusCounts;
};

export function StatusChart({ counts }: StatusChartProps) {
  const max = Math.max(...QUOTE_STATUSES.map((status) => counts[status]), 1);

  return (
    <section
      aria-labelledby="status-chart-heading"
      className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-5 shadow-sm sm:p-6"
    >
      <h2
        id="status-chart-heading"
        className="text-lg font-semibold tracking-tight text-text-primary"
      >
        Quote Status Overview
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Current non-archived totals by status.
      </p>

      <ul className="mt-6 space-y-4" aria-label="Quote status chart">
        {QUOTE_STATUSES.map((status) => {
          const meta = STATUS_META[status];
          const value = counts[status];
          const width = `${Math.round((value / max) * 100)}%`;

          return (
            <li key={status} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text-primary">
                  {meta.label}
                </span>
                <span className="font-semibold tabular-nums text-text-primary">
                  {value}
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-bg-muted"
                role="img"
                aria-label={`${meta.label}: ${value}`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-200 ease-out ${meta.barClass}`}
                  style={{ width }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
