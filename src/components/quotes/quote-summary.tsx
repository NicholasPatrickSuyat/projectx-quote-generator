"use client";

import { buttonClassName } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { quoteStatusTone, type Quote } from "@/types/quote";
import Link from "next/link";

type QuoteSummaryProps = {
  quote: Quote;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  canRestore?: boolean;
  onGeneratePdf: () => void;
  generatePdfLabel?: string;
  generatePdfBusy?: boolean;
  onEdit: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-3">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

export function QuoteSummary({
  quote,
  onDuplicate,
  onArchive,
  onRestore,
  canRestore = false,
  onGeneratePdf,
  generatePdfLabel = "Generate PDF",
  generatePdfBusy = false,
  onEdit,
}: QuoteSummaryProps) {
  const snap = quote.customerSnapshot;
  const address = snap
    ? [snap.street, snap.city, snap.state, snap.zip].filter(Boolean).join(", ")
    : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-1 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={quote.archived ? "Archived" : quote.status}
            tone={quote.archived ? "archived" : quoteStatusTone(quote.status)}
          />
          {quote.archived && quote.statusBeforeArchive ? (
            <span className="text-xs text-text-secondary">
              Was {quote.statusBeforeArchive}
            </span>
          ) : null}
        </div>

        <dl className="space-y-3">
          <DetailRow label="Quote ID" value={quote.id} />
          <DetailRow label="Quote Date" value={formatShortDate(quote.quoteDate)} />
          <DetailRow
            label="Valid Until"
            value={
              quote.validUntil ? formatShortDate(quote.validUntil) : "—"
            }
          />
          <DetailRow
            label="Grand Total"
            value={formatCurrency(quote.grandTotal)}
          />
          <DetailRow label="Prepared By" value={quote.preparedBy} />
          <DetailRow
            label="Job"
            value={quote.jobDescription || "No job description yet"}
          />
        </dl>

        <section className="space-y-3 border-t border-border-default pt-5">
          <h3 className="text-sm font-semibold text-text-primary">Customer</h3>
          {snap ? (
            <dl className="space-y-3">
              <DetailRow label="Name" value={snap.customerName} />
              {snap.companyName ? (
                <DetailRow label="Company" value={snap.companyName} />
              ) : null}
              {snap.customerId ? (
                <DetailRow label="Customer ID" value={snap.customerId} />
              ) : null}
              {snap.phone ? <DetailRow label="Phone" value={snap.phone} /> : null}
              {snap.email ? <DetailRow label="Email" value={snap.email} /> : null}
              {address ? <DetailRow label="Address" value={address} /> : null}
            </dl>
          ) : (
            <p className="text-sm text-text-secondary">No customer attached.</p>
          )}
          {snap?.customerId ? (
            <Link
              href={`/customers`}
              className={buttonClassName({ variant: "ghost", size: "sm" })}
            >
              View Customers
            </Link>
          ) : null}
        </section>

        <section className="space-y-2 border-t border-border-default pt-5">
          <h3 className="text-sm font-semibold text-text-primary">Totals</h3>
          <dl className="space-y-2">
            <DetailRow label="Subtotal" value={formatCurrency(quote.subtotal)} />
            <DetailRow
              label="Discount"
              value={formatCurrency(quote.discountAmount)}
            />
            <DetailRow label="Tax" value={formatCurrency(quote.taxAmount)} />
            <DetailRow
              label="Line items"
              value={String(quote.lineItems.length)}
            />
          </dl>
        </section>

        <section className="space-y-2 border-t border-border-default pt-5">
          <h3 className="text-sm font-semibold text-text-primary">Timeline</h3>
          <dl className="space-y-2 text-sm">
            <DetailRow label="Created" value={formatShortDate(quote.createdAt)} />
            <DetailRow label="Updated" value={formatShortDate(quote.updatedAt)} />
            {quote.sentAt ? (
              <DetailRow label="Sent" value={formatShortDate(quote.sentAt)} />
            ) : null}
            {quote.acceptedAt ? (
              <DetailRow
                label="Accepted"
                value={formatShortDate(quote.acceptedAt)}
              />
            ) : null}
            {quote.rejectedAt ? (
              <DetailRow
                label="Rejected"
                value={formatShortDate(quote.rejectedAt)}
              />
            ) : null}
            {quote.expiredAt ? (
              <DetailRow
                label="Expired"
                value={formatShortDate(quote.expiredAt)}
              />
            ) : null}
            {quote.archivedAt ? (
              <DetailRow
                label="Archived"
                value={formatShortDate(quote.archivedAt)}
              />
            ) : null}
          </dl>
        </section>

      </div>

      <div className="sticky bottom-0 -mx-1 mt-auto flex flex-wrap gap-2 border-t border-border-default bg-bg-surface px-1 pt-4 pb-1">
        <button
          type="button"
          className={buttonClassName({ variant: "secondary", size: "sm" })}
          onClick={onEdit}
        >
          Edit
        </button>
        <button
          type="button"
          className={buttonClassName({ variant: "secondary", size: "sm" })}
          onClick={onDuplicate}
        >
          Duplicate
        </button>
        <button
          type="button"
          className={buttonClassName({ variant: "secondary", size: "sm" })}
          onClick={onGeneratePdf}
          disabled={generatePdfBusy}
        >
          {generatePdfBusy ? "Generating…" : generatePdfLabel}
        </button>
        {quote.archived ? (
          canRestore ? (
            <button
              type="button"
              className={buttonClassName({ variant: "secondary", size: "sm" })}
              onClick={onRestore}
            >
              Restore
            </button>
          ) : null
        ) : (
          <button
            type="button"
            className={buttonClassName({ variant: "secondary", size: "sm" })}
            onClick={onArchive}
          >
            Archive
          </button>
        )}
      </div>
    </div>
  );
}
