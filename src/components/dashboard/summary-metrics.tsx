import {
  IconCheckCircle,
  IconClock,
  IconCurrency,
  IconFileText,
  IconSend,
} from "@/components/icons";
import type { SummaryMetrics } from "@/lib/dashboard/metrics";
import { formatCurrency } from "@/lib/format";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

type SummaryMetricsProps = {
  metrics: SummaryMetrics;
  presetLabel: string;
};

type MetricCard = {
  label: string;
  value: string;
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function SummaryMetricsCards({
  metrics,
  presetLabel,
}: SummaryMetricsProps) {
  const cards: MetricCard[] = [
    {
      label: "Quotes Created",
      value: String(metrics.quotesCreated),
      href: "/quotes",
      icon: IconFileText,
    },
    {
      label: "Quotes Sent",
      value: String(metrics.quotesSent),
      href: "/quotes?status=Sent",
      icon: IconSend,
    },
    {
      label: "Quotes Accepted",
      value: String(metrics.quotesAccepted),
      href: "/quotes?status=Accepted",
      icon: IconCheckCircle,
    },
    {
      label: "Accepted Quote Value",
      value: formatCurrency(metrics.acceptedQuoteValue),
      href: "/quotes?status=Accepted",
      icon: IconCurrency,
    },
    {
      label: "Expiring Within 7 Days",
      value: String(metrics.expiringWithin7Days),
      href: "/quotes?expiring=7",
      icon: IconClock,
    },
  ];

  return (
    <section aria-labelledby="summary-metrics-heading" className="space-y-4">
      <div className="space-y-1">
        <h2
          id="summary-metrics-heading"
          className="text-xs font-semibold tracking-wider text-text-secondary uppercase"
        >
          Summary Metrics
        </h2>
        <p className="text-sm text-text-secondary">Showing {presetLabel}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm transition-[border-color,background-color,box-shadow] duration-150 hover:border-border-strong hover:bg-bg-muted hover:shadow-md focus-visible:border-primary-hover focus-visible:bg-primary-subtle focus-visible:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover"
            >
              <div className="flex items-center gap-2 text-text-secondary">
                <Icon
                  className="size-3.5 shrink-0 transition-colors duration-150 group-hover:text-text-primary"
                  aria-hidden
                />
                <span className="text-xs font-semibold tracking-wider uppercase">
                  {card.label}
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
                {card.value}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
