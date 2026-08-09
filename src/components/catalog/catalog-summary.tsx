"use client";

import { StatusBadge } from "@/components/ui/status-badge";
import { buttonClassName } from "@/components/ui/button";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  catalogRecordStatus,
  type CatalogItem,
} from "@/types/catalog";

type CatalogSummaryProps = {
  item: CatalogItem;
  canManage: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onRestore: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-3">
      <dt className="text-sm text-text-secondary">{label}</dt>
      <dd className="text-sm font-medium text-text-primary">{value}</dd>
    </div>
  );
}

export function CatalogSummary({
  item,
  canManage,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
}: CatalogSummaryProps) {
  const status = catalogRecordStatus(item);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xl font-semibold tracking-tight text-text-primary">
            {item.name}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-text-secondary">
            <span className="font-mono tabular-nums">{item.id}</span>
            <StatusBadge
              label={status}
              tone={status === "Active" ? "active" : "archived"}
            />
          </div>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
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
            {item.archived ? (
              <button
                type="button"
                className={buttonClassName({ variant: "primary", size: "sm" })}
                onClick={onRestore}
              >
                Restore
              </button>
            ) : (
              <button
                type="button"
                className={buttonClassName({ variant: "ghost", size: "sm" })}
                onClick={onArchive}
              >
                Archive
              </button>
            )}
          </div>
        ) : null}
      </div>

      <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-text-primary">
          Catalog Details
        </h3>
        <dl className="mt-3 space-y-3">
          <DetailRow label="Service Name" value={item.name} />
          <DetailRow label="Category" value={item.category} />
          <DetailRow
            label="Description"
            value={item.description.trim() || "—"}
          />
          <DetailRow label="Unit" value={item.unit.trim() || "—"} />
          <DetailRow
            label="Default Price"
            value={formatCurrency(item.unitPrice)}
          />
          <DetailRow label="Status" value={status} />
          <DetailRow
            label="Created"
            value={formatShortDate(item.createdAt)}
          />
          <DetailRow
            label="Last Updated"
            value={formatShortDate(item.updatedAt)}
          />
        </dl>
      </section>
    </div>
  );
}
