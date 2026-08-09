import { StatusBadge } from "@/components/ui/status-badge";
import { buttonClassName } from "@/components/ui/button";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  customerCityState,
  customerDisplayName,
  customerRecordStatus,
  type Customer,
} from "@/types/customer";
import Link from "next/link";

type CustomerSummaryProps = {
  customer: Customer;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
};

const quoteTone = {
  Draft: "draft",
  Sent: "sent",
  Accepted: "accepted",
  Rejected: "rejected",
  Expired: "expired",
} as const;

export function CustomerSummary({
  customer,
  onEdit,
  onArchive,
  onRestore,
}: CustomerSummaryProps) {
  const status = customerRecordStatus(customer);
  const address = `${customer.street}, ${customerCityState(customer)} ${customer.zip}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-tight text-text-primary">
            {customerDisplayName(customer)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="font-mono tabular-nums">{customer.id}</span>
            <StatusBadge
              label={status}
              tone={status === "Active" ? "active" : "archived"}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            onClick={onEdit}
          >
            Edit
          </button>
          {customer.archived ? (
            <button
              type="button"
              className={buttonClassName({ variant: "primary", size: "sm" })}
              onClick={onRestore}
            >
              Restore
            </button>
          ) : (
            <>
              <Link
                href={`/quotes/new?customer=${customer.id}`}
                className={buttonClassName({ variant: "primary", size: "sm" })}
              >
                New Quote
              </Link>
              <button
                type="button"
                className={buttonClassName({ variant: "ghost", size: "sm" })}
                onClick={onArchive}
              >
                Archive
              </button>
            </>
          )}
        </div>
      </div>

      <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary">
          Customer Information
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-text-secondary">Phone</dt>
            <dd className="font-medium text-text-primary">{customer.phone}</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Email</dt>
            <dd className="font-medium text-text-primary">
              {customer.email || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Company</dt>
            <dd className="font-medium text-text-primary">
              {customer.companyName || "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-text-secondary">Service address</dt>
            <dd className="font-medium text-text-primary">{address}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-text-secondary">Internal notes</dt>
            <dd className="font-medium text-text-primary whitespace-pre-wrap">
              {customer.internalNotes || "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary">Totals</h3>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-text-secondary">Total Quotes</dt>
            <dd className="text-lg font-semibold tabular-nums text-text-primary">
              {customer.totalQuotes}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Draft</dt>
            <dd className="text-lg font-semibold tabular-nums text-text-primary">
              {customer.draftQuotes}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Accepted</dt>
            <dd className="text-lg font-semibold tabular-nums text-text-primary">
              {customer.acceptedQuotes}
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Last Activity</dt>
            <dd className="text-lg font-semibold tabular-nums text-text-primary">
              {customer.lastQuoteDate
                ? formatShortDate(customer.lastQuoteDate)
                : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Recent Quotes
          </h3>
          <Link
            href={`/quotes?customer=${customer.id}`}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            View all
          </Link>
        </div>
        {customer.recentQuotes.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">
            No recent quotes for this customer.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border-default overflow-hidden rounded-[var(--radius-md)] border border-border-default">
            {customer.recentQuotes.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/quotes?customer=${customer.id}`}
                  className="flex flex-col gap-1 px-3 py-2.5 transition-colors duration-150 hover:bg-bg-muted sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-text-primary">
                    {quote.number}
                    <span className="ml-2 inline-flex align-middle">
                      <StatusBadge
                        label={quote.status}
                        tone={quoteTone[quote.status]}
                      />
                    </span>
                  </span>
                  <span className="text-sm text-text-secondary tabular-nums">
                    {formatShortDate(quote.date)} · {formatCurrency(quote.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
