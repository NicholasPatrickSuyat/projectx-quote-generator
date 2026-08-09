import type { AttentionItem, NeedsAttention } from "@/lib/dashboard/metrics";
import Link from "next/link";

type NeedsAttentionPanelProps = {
  data: NeedsAttention;
};

type AttentionSection = {
  title: string;
  empty: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: AttentionItem[];
};

export function NeedsAttentionPanel({ data }: NeedsAttentionPanelProps) {
  const sections: AttentionSection[] = [
    {
      title: "Drafts older than 7 days",
      empty: "No stale drafts right now.",
      viewAllHref: "/quotes?attention=drafts-stale",
      viewAllLabel: "View all drafts older than 7 days",
      items: data.staleDrafts,
    },
    {
      title: "Expiring within 7 days",
      empty: "Nothing expiring in the next 7 days.",
      viewAllHref: "/quotes?expiringSoon=1",
      viewAllLabel: "View all quotes expiring within 7 days",
      items: data.expiringSoon,
    },
    {
      title: "Recently sent awaiting response",
      empty: "No sent quotes awaiting a response.",
      viewAllHref: "/quotes?attention=awaiting-response",
      viewAllLabel: "View all recently sent quotes awaiting response",
      items: data.recentlySent,
    },
  ];

  return (
    <section
      aria-labelledby="needs-attention-heading"
      className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-5 shadow-sm sm:p-6"
    >
      <div>
        <h2
          id="needs-attention-heading"
          className="text-lg font-semibold tracking-tight text-text-primary"
        >
          Needs Attention
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Work queues that help decide what to tackle next.
        </p>
      </div>

      <div className="mt-6 space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-text-primary">
                {section.title}
              </h3>
              <Link
                href={section.viewAllHref}
                aria-label={section.viewAllLabel}
                className="rounded-sm text-sm font-medium text-primary transition-colors duration-150 hover:text-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover"
              >
                View all
              </Link>
            </div>

            {section.items.length === 0 ? (
              <p className="rounded-[var(--radius-md)] bg-bg-muted px-3 py-3 text-sm text-text-secondary">
                {section.empty}
              </p>
            ) : (
              <ul className="overflow-hidden rounded-[var(--radius-md)] border border-border-default">
                {section.items.map((item, index) => (
                  <li
                    key={item.id}
                    className={
                      index > 0 ? "border-t border-border-default" : undefined
                    }
                  >
                    <Link
                      href={item.href}
                      aria-label={`${item.number}, ${item.customerName}. ${item.meta}`}
                      className="flex flex-col gap-0.5 px-3.5 py-3 transition-[background-color,box-shadow] duration-150 hover:bg-bg-muted focus-visible:bg-primary-subtle focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-hover sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-text-primary">
                          {item.number}
                          <span className="font-normal text-text-secondary">
                            {" "}
                            · {item.customerName}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-text-secondary tabular-nums sm:text-sm">
                        {item.meta}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
