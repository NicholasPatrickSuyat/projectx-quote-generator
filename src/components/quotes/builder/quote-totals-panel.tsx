"use client";

import { Button } from "@/components/ui/button";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import { IconChevronDown, IconChevronUp } from "@/components/icons";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { DiscountType, Quote, QuoteStatus } from "@/types/quote";
import { useEffect, useState } from "react";

type QuoteTotalsPanelProps = {
  quote: Quote;
  editable: boolean;
  saved: boolean;
  saving: boolean;
  pdfBusy?: boolean;
  discountError?: string;
  taxRateError?: string;
  lastSavedAt: string | null;
  onDiscountTypeChange: (type: DiscountType) => void;
  onDiscountValueChange: (value: number) => void;
  onTaxRateChange: (rate: number) => void;
  onSaveDraft: () => void;
  onPreviewPdf: () => void;
  onFinalPdf: () => void;
  onMarkSent: () => void;
  onReturnToDraft: () => void;
  onAccepted: () => void;
  onRejected: () => void;
  onExpired: () => void;
  onReactivate: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDuplicate: () => void;
};

function TotalsBreakdown({
  quote,
  editable,
  discountError,
  taxRateError,
  onDiscountTypeChange,
  onDiscountValueChange,
  onTaxRateChange,
}: Pick<
  QuoteTotalsPanelProps,
  | "quote"
  | "editable"
  | "discountError"
  | "taxRateError"
  | "onDiscountTypeChange"
  | "onDiscountValueChange"
  | "onTaxRateChange"
>) {
  return (
    <dl className="space-y-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <dt className="text-text-secondary">Subtotal</dt>
        <dd className="font-medium text-text-primary">
          {formatCurrency(quote.subtotal)}
        </dd>
      </div>

      <div className="space-y-2 border-t border-border-default pt-3">
        <FormField id="discount-type" label="Discount">
          <Select
            {...fieldControlProps("discount-type")}
            value={quote.discountType}
            disabled={!editable}
            onChange={(event) =>
              onDiscountTypeChange(event.target.value as DiscountType)
            }
          >
            <option value="none">None</option>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </Select>
        </FormField>
        {quote.discountType !== "none" ? (
          <FormField
            id="discount-value"
            label={
              quote.discountType === "percent"
                ? "Discount (%)"
                : "Discount ($)"
            }
            error={discountError}
          >
            <Input
              {...fieldControlProps("discount-value", discountError)}
              type="number"
              min={0}
              step={quote.discountType === "percent" ? "0.1" : "0.01"}
              value={quote.discountValue}
              disabled={!editable}
              onChange={(event) =>
                onDiscountValueChange(Number(event.target.value))
              }
            />
          </FormField>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-secondary">Discount amount</dt>
          <dd className="font-medium text-text-primary">
            −{formatCurrency(quote.discountAmount)}
          </dd>
        </div>
      </div>

      <div className="space-y-2 border-t border-border-default pt-3">
        <FormField id="tax-rate" label="Tax Rate (%)" error={taxRateError}>
          <Input
            {...fieldControlProps("tax-rate", taxRateError)}
            type="number"
            min={0}
            step="0.01"
            value={quote.taxRate}
            disabled={!editable}
            onChange={(event) => onTaxRateChange(Number(event.target.value))}
          />
        </FormField>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-text-secondary">Tax</dt>
          <dd className="font-medium text-text-primary">
            {formatCurrency(quote.taxAmount)}
          </dd>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border-default pt-3">
        <dt className="text-base font-semibold text-text-primary">Grand Total</dt>
        <dd className="text-lg font-semibold text-text-primary">
          {formatCurrency(quote.grandTotal)}
        </dd>
      </div>
    </dl>
  );
}

function StatusActions({
  quote,
  saved,
  onMarkSent,
  onReturnToDraft,
  onAccepted,
  onRejected,
  onExpired,
  onReactivate,
  onArchive,
  onRestore,
  onDuplicate,
}: Pick<
  QuoteTotalsPanelProps,
  | "quote"
  | "saved"
  | "onMarkSent"
  | "onReturnToDraft"
  | "onAccepted"
  | "onRejected"
  | "onExpired"
  | "onReactivate"
  | "onArchive"
  | "onRestore"
  | "onDuplicate"
>) {
  if (!saved) return null;

  const status: QuoteStatus = quote.status;
  const archived = quote.archived;

  if (archived) {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onRestore}>
          Restore
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
          Duplicate
        </Button>
      </div>
    );
  }

  if (status === "Expired") {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="primary" size="sm" onClick={onReactivate}>
          Reactivate to Draft
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onArchive}>
          Archive
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
          Duplicate
        </Button>
      </div>
    );
  }

  if (status === "Accepted" || status === "Rejected") {
    return (
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onArchive}>
          Archive
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
          Duplicate
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {status === "Draft" ? (
        <Button type="button" variant="primary" size="sm" onClick={onMarkSent}>
          Mark as Sent
        </Button>
      ) : null}
      {status === "Sent" ? (
        <Button type="button" variant="secondary" size="sm" onClick={onReturnToDraft}>
          Return to Draft
        </Button>
      ) : null}
      {status === "Sent" ? (
        <>
          <Button type="button" variant="secondary" size="sm" onClick={onAccepted}>
            Mark Accepted
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onRejected}>
            Mark Rejected
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onExpired}>
            Mark Expired
          </Button>
        </>
      ) : null}
      <Button type="button" variant="secondary" size="sm" onClick={onArchive}>
        Archive
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onDuplicate}>
        Duplicate
      </Button>
    </div>
  );
}

function PanelContent(props: QuoteTotalsPanelProps) {
  const {
    editable,
    saving,
    pdfBusy = false,
    lastSavedAt,
    onSaveDraft,
    onPreviewPdf,
    onFinalPdf,
  } = props;

  return (
    <div className="space-y-4">
      <TotalsBreakdown {...props} />
      {lastSavedAt ? (
        <p className="text-xs text-text-secondary">
          Last saved {lastSavedAt}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 border-t border-border-default pt-4">
        {editable ? (
          <Button
            type="button"
            variant="primary"
            onClick={onSaveDraft}
            disabled={saving || pdfBusy}
          >
            {saving ? "Saving…" : "Save Draft"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={onPreviewPdf}
          disabled={pdfBusy}
        >
          {pdfBusy ? "Generating…" : "Preview PDF"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onFinalPdf}
          disabled={pdfBusy}
        >
          {pdfBusy ? "Generating…" : "Final PDF"}
        </Button>
      </div>
      <div className="border-t border-border-default pt-4">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Status Actions
        </h3>
        <StatusActions {...props} />
      </div>
    </div>
  );
}

function useIsDesktopTotals(): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return isDesktop;
}

export function QuoteTotalsPanel(props: QuoteTotalsPanelProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDesktop = useIsDesktopTotals();

  // Avoid mounting two interactive control trees (duplicate DOM ids).
  if (isDesktop === null) {
    return (
      <aside className="hidden lg:block">
        <div className="sticky top-6 h-48 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
      </aside>
    );
  }

  if (isDesktop) {
    return (
      <aside>
        <div className="sticky top-6 rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Totals</h2>
          <PanelContent {...props} />
        </div>
      </aside>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-default bg-bg-surface shadow-md">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
      >
        <span className="text-sm font-semibold text-text-primary">
          {formatCurrency(props.quote.grandTotal)}
        </span>
        <span className="flex items-center gap-1 text-sm text-text-secondary">
          Totals & actions
          {mobileOpen ? <IconChevronDown /> : <IconChevronUp />}
        </span>
      </button>
      <div
        className={cn(
          "max-h-[70vh] overflow-y-auto border-t border-border-default px-4 py-4",
          !mobileOpen && "hidden",
        )}
      >
        {mobileOpen ? <PanelContent {...props} /> : null}
      </div>
    </div>
  );
}
