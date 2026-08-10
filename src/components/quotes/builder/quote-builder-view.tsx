"use client";

import { CatalogPicker } from "@/components/quotes/builder/catalog-picker";
import { CustomerGate } from "@/components/quotes/builder/customer-gate";
import { LineItemsEditor } from "@/components/quotes/builder/line-items-editor";
import { QuoteTotalsPanel } from "@/components/quotes/builder/quote-totals-panel";
import {
  PdfActionStatus,
  useQuotePdfActions,
} from "@/components/pdf/pdf-action-status";
import {
  CustomerForm,
  CustomerFormFooter,
} from "@/components/customers/customer-form";
import { IconAlert } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { StatusBadge } from "@/components/ui/status-badge";
import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
import { useCustomerSession } from "@/components/session/customer-session-provider";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { useQuoteSession } from "@/components/session/quote-session-provider";
import { preparedByFromSessionUser } from "@/lib/quotes/prepared-by";
import { useRegisterUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import {
  catalogLineDescription,
  type CatalogItem,
} from "@/types/catalog";
import { emptyCustomerForm } from "@/lib/customers/demo-data";
import {
  validateCustomerForm,
  type CustomerFieldErrors,
} from "@/lib/customers/filters";
import {
  computeLineTotal,
  withRecalculatedTotals,
} from "@/lib/quotes/calculations";
import { customerToSnapshot, nextLineId } from "@/lib/quotes/demo-data";
import { createQuotePdfSnapshot } from "@/lib/pdf/snapshot";
import {
  archiveQuote,
  markQuoteAccepted,
  markQuoteExpired,
  markQuoteRejected,
  markQuoteSent,
  quoteIsEditable,
  reactivateQuoteToDraft,
  restoreQuote,
  returnQuoteToDraft,
} from "@/lib/quotes/mutations";
import {
  canMarkAsSent,
  firstQuoteFieldError,
  hasQuoteFieldErrors,
  stripEmptyLines,
  validateQuoteForPersist,
  type QuoteFieldErrors,
} from "@/lib/quotes/validation";
import {
  formatShortDate,
  parseLocalDate,
  startOfDay,
  toIsoDate,
} from "@/lib/format";
import type { CustomerFormValues } from "@/types/customer";
import {
  emptyCustomerSnapshot,
  quoteStatusTone,
  type Quote,
  type QuoteCustomerSnapshot,
  type QuoteLineItem,
} from "@/types/quote";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type QuoteBuilderViewProps = {
  mode: "create" | "edit";
  quoteId?: string;
  initialCustomerId?: string | null;
};

type ConfirmState =
  | { type: "leave"; href: string }
  | { type: "sentEdit" }
  | { type: "changeCustomerSent" }
  | { type: "markSent" }
  | { type: "finalPdf" }
  | { type: "returnToDraft" }
  | { type: "accepted" }
  | { type: "rejected" }
  | { type: "expired" }
  | { type: "reactivate" }
  | { type: "archive" }
  | { type: "restore" }
  | { type: "duplicateDirty" }
  | { type: "duplicateLastSaved" }
  | null;

function serializeQuote(quote: Quote): string {
  return JSON.stringify(quote);
}

function isFormEditable(quote: Quote): boolean {
  if (quote.archived) return false;
  if (
    quote.status === "Accepted" ||
    quote.status === "Rejected" ||
    quote.status === "Expired"
  ) {
    return false;
  }
  return quoteIsEditable(quote);
}

function isValidUntilPast(
  validUntil: string | null,
  today: Date | null,
): boolean {
  if (!validUntil || !today) return false;
  return parseLocalDate(validUntil) < startOfDay(today);
}

function catalogItemsToLines(
  items: CatalogItem[],
  existing: QuoteLineItem[],
): QuoteLineItem[] {
  let lines = [...existing];
  for (const item of items) {
    const description = catalogLineDescription(item);
    const line: QuoteLineItem = {
      id: nextLineId(lines),
      category: item.category,
      description,
      quantity: 1,
      unitPrice: item.unitPrice,
      unit: item.unit,
      internalNotes: "",
      sortOrder: lines.length,
      lineTotal: computeLineTotal(1, item.unitPrice),
    };
    lines = [...lines, line];
  }
  return lines;
}

function isInternalAppHref(href: string): boolean {
  if (!href || href.startsWith("#")) return false;
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return href.startsWith("/");
}

export function QuoteBuilderView({
  mode,
  quoteId,
  initialCustomerId = null,
}: QuoteBuilderViewProps) {
  const router = useRouter();
  const {
    ready: quotesReady,
    today,
    getQuote,
    upsertQuote,
    createDraft,
    buildDraft,
    duplicate,
  } = useQuoteSession();
  const { ready: customersReady, customers, getCustomer, createCustomer } =
    useCustomerSession();
  const { getQuoteDefaults, settings } = useCompanySettingsSession();
  const { currentUser, capabilities } = useDemoAuthSession();
  const {
    pdfState,
    pdfBusy,
    runPreview,
    runFinalFromSnapshot,
    runFinalAfterSend,
    clearPdfState,
  } = useQuotePdfActions({ settings, today });

  const [initialized, setInitialized] = useState(false);
  const [draft, setDraft] = useState<Quote | null>(null);
  const [baseline, setBaseline] = useState<Quote | null>(null);
  const [fieldErrors, setFieldErrors] = useState<QuoteFieldErrors>({});
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [sentEditingUnlocked, setSentEditingUnlocked] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [pickingCustomer, setPickingCustomer] = useState(false);
  const [customerSlideOpen, setCustomerSlideOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerFormValues>(
    emptyCustomerForm(),
  );
  const [customerFormErrors, setCustomerFormErrors] =
    useState<CustomerFieldErrors>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const allowLeaveRef = useRef(false);

  const ready = quotesReady && customersReady && Boolean(today);

  const activeCustomers = useMemo(
    () => customers.filter((customer) => !customer.archived),
    [customers],
  );

  const dirty = useMemo(() => {
    if (!draft || !baseline) return false;
    return serializeQuote(draft) !== serializeQuote(baseline);
  }, [draft, baseline]);

  useRegisterUnsavedChanges(dirty);

  const saved = mode === "edit" && Boolean(quoteId);

  const recalculatedDraft = useMemo(
    () => (draft ? withRecalculatedTotals(draft) : null),
    [draft],
  );

  const baseEditable = recalculatedDraft
    ? isFormEditable(recalculatedDraft)
    : true;
  const needsSentUnlock = Boolean(
    recalculatedDraft &&
      !recalculatedDraft.archived &&
      recalculatedDraft.status === "Sent",
  );
  const editable =
    baseEditable && (!needsSentUnlock || sentEditingUnlocked);
  const canChangeCustomer =
    editable &&
    Boolean(recalculatedDraft) &&
    !recalculatedDraft!.archived &&
    (recalculatedDraft!.status === "Draft" ||
      recalculatedDraft!.status === "Sent");

  if (ready && !initialized) {
    if (mode === "create") {
      let snapshot: QuoteCustomerSnapshot | null = null;
      if (initialCustomerId) {
        const customer = getCustomer(initialCustomerId);
        if (customer && !customer.archived) {
          snapshot = customerToSnapshot(customer);
        }
      }
      const sessionPreparedBy = preparedByFromSessionUser(
        currentUser?.fullName,
      );
      const created = {
        ...buildDraft(
          snapshot ?? emptyCustomerSnapshot(),
          sessionPreparedBy !== undefined
            ? { preparedBy: sessionPreparedBy }
            : undefined,
        ),
        customerSnapshot: snapshot,
      };
      setDraft(created);
      setBaseline(created);
      setInitialized(true);
    } else if (mode === "edit" && quoteId) {
      const stored = getQuote(quoteId);
      if (stored) {
        setDraft(stored);
        setBaseline(stored);
        setLastSavedAt(stored.updatedAt);
        if (stored.status === "Sent" && !stored.archived) {
          setSentEditingUnlocked(false);
          setConfirm({ type: "sentEdit" });
        } else {
          setSentEditingUnlocked(true);
        }
      }
      setInitialized(true);
    }
  }

  // Sync edit draft from store when external session updates and local form is clean.
  const storeQuote =
    mode === "edit" && quoteId ? getQuote(quoteId) : undefined;
  if (
    mode === "edit" &&
    quoteId &&
    initialized &&
    !dirty &&
    storeQuote &&
    draft &&
    serializeQuote(storeQuote) !== serializeQuote(draft)
  ) {
    setDraft(storeQuote);
    setBaseline(storeQuote);
    setLastSavedAt(storeQuote.updatedAt);
  }

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeaveRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;

    function onDocumentClick(event: MouseEvent) {
      if (allowLeaveRef.current) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || !isInternalAppHref(hrefAttr)) return;

      const url = new URL(hrefAttr, window.location.href);
      const next =
        `${url.pathname}${url.search}${url.hash}` || url.pathname;
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next === current) return;

      event.preventDefault();
      event.stopPropagation();
      setConfirm({ type: "leave", href: next });
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [dirty]);

  const updateDraft = useCallback((patch: Partial<Quote>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
    setFieldErrors({});
    setStatusMessage(null);
  }, []);

  const updateLineItems = useCallback((lineItems: QuoteLineItem[]) => {
    setDraft((prev) => (prev ? { ...prev, lineItems } : prev));
    setFieldErrors((prev) => ({
      ...prev,
      lines: undefined,
      lineItems: undefined,
    }));
    setStatusMessage(null);
  }, []);

  function applyCustomerSnapshot(snapshot: QuoteCustomerSnapshot) {
    updateDraft({ customerSnapshot: snapshot });
    setPickingCustomer(false);
    setFieldErrors((prev) => ({ ...prev, customer: undefined }));
  }

  function handleSelectCustomer(customerId: string) {
    const customer = getCustomer(customerId);
    if (!customer || customer.archived) return;
    applyCustomerSnapshot(customerToSnapshot(customer));
  }

  function requestChangeCustomer() {
    if (!recalculatedDraft || !editable) return;
    if (recalculatedDraft.status === "Sent") {
      setConfirm({ type: "changeCustomerSent" });
      return;
    }
    setPickingCustomer(true);
  }

  function handleCreateCustomerSubmit() {
    const errors = validateCustomerForm(customerForm);
    setCustomerFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    const created = createCustomer(customerForm);
    applyCustomerSnapshot(customerToSnapshot(created));
    setCustomerSlideOpen(false);
    setCustomerForm(emptyCustomerForm());
    setCustomerFormErrors({});
  }

  function applyValidationFailure(errors: QuoteFieldErrors, reason?: string) {
    setFieldErrors(errors);
    setStatusMessage(reason ?? firstQuoteFieldError(errors));
    if (errors.customer) setPickingCustomer(true);
  }

  /** Sanitize empty lines, validate, and persist. Returns saved quote or null. */
  function persistValidatedDraft(): Quote | null {
    if (!recalculatedDraft) return null;

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });

    const errors = validateQuoteForPersist(sanitized);
    if (hasQuoteFieldErrors(errors)) {
      applyValidationFailure(errors);
      setDraft(sanitized);
      return null;
    }

    if (mode === "create") {
      const snapshot = sanitized.customerSnapshot!;
      const savedQuote = createDraft(snapshot, sanitized);
      setDraft(savedQuote);
      setBaseline(savedQuote);
      setLastSavedAt(savedQuote.updatedAt);
      setFieldErrors({});
      setStatusMessage(null);
      return savedQuote;
    }

    const savedQuote = upsertQuote(sanitized);
    setDraft(savedQuote);
    setBaseline(savedQuote);
    setLastSavedAt(savedQuote.updatedAt);
    setFieldErrors({});
    setStatusMessage(null);
    return savedQuote;
  }

  function handleSaveDraft() {
    if (!recalculatedDraft) return;
    setSaving(true);
    const savedQuote = persistValidatedDraft();
    setSaving(false);
    if (savedQuote && mode === "create") {
      router.replace(`/quotes/${savedQuote.id}/edit`);
    }
  }

  function persistAndMutate(apply: (quote: Quote, day: Date) => Quote) {
    if (!recalculatedDraft || !today) return false;

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });

    const errors = validateQuoteForPersist(sanitized);
    if (hasQuoteFieldErrors(errors)) {
      applyValidationFailure(
        errors,
        firstQuoteFieldError(errors) ??
          "Fix validation errors before changing status.",
      );
      setDraft(sanitized);
      return false;
    }

    const updated = apply(sanitized, today);
    const savedQuote = upsertQuote(updated);
    setDraft(savedQuote);
    setBaseline(savedQuote);
    setLastSavedAt(savedQuote.updatedAt);
    setFieldErrors({});
    setStatusMessage(null);
    if (savedQuote.status === "Sent" && !savedQuote.archived) {
      setSentEditingUnlocked(false);
    } else if (!savedQuote.archived && savedQuote.status === "Draft") {
      setSentEditingUnlocked(true);
    }
    return true;
  }

  function handleMarkSent() {
    if (!recalculatedDraft) return;

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });
    setDraft(sanitized);

    const check = canMarkAsSent(sanitized);
    if (!check.ok) {
      applyValidationFailure(check.errors, check.reason);
      return;
    }

    setConfirm({ type: "markSent" });
  }

  function handlePreviewPdf() {
    if (!recalculatedDraft || pdfBusy) return;
    clearPdfState();
    void runPreview(recalculatedDraft);
  }

  function handleFinalPdf() {
    if (!recalculatedDraft || pdfBusy) return;
    clearPdfState();

    if (recalculatedDraft.pdfSnapshot && recalculatedDraft.status !== "Draft") {
      void runFinalFromSnapshot(recalculatedDraft);
      return;
    }

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });
    setDraft(sanitized);

    const check = canMarkAsSent(sanitized);
    if (!check.ok) {
      applyValidationFailure(check.errors, check.reason);
      return;
    }

    setConfirm({ type: "finalPdf" });
  }

  async function confirmFinalPdfAndSend() {
    if (!recalculatedDraft || !today || pdfBusy) return;
    setConfirm(null);

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });

    const check = canMarkAsSent(sanitized);
    if (!check.ok) {
      applyValidationFailure(check.errors, check.reason);
      setDraft(sanitized);
      return;
    }

    const frozenAt = toIsoDate(startOfDay(today));
    let snapshot;
    try {
      snapshot = createQuotePdfSnapshot(sanitized, settings, frozenAt);
    } catch (error) {
      applyValidationFailure(
        {},
        error instanceof Error
          ? error.message
          : "Could not freeze the PDF snapshot.",
      );
      return;
    }

    const sent = markQuoteSent(sanitized, today, snapshot);
    const savedQuote = upsertQuote(sent);
    setDraft(savedQuote);
    setBaseline(savedQuote);
    setLastSavedAt(savedQuote.updatedAt);
    setFieldErrors({});
    setStatusMessage(null);
    setSentEditingUnlocked(false);

    // Keep create-route mounted until PDF finishes so ready/error UI is not lost.
    await runFinalAfterSend(savedQuote);

    if (mode === "create") {
      router.replace(`/quotes/${savedQuote.id}/edit`);
    }
  }

  function confirmReturnToDraft() {
    if (!recalculatedDraft || !today) return;
    setConfirm(null);

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });
    const updated = returnQuoteToDraft(sanitized, today);
    const savedQuote = upsertQuote(updated);
    setDraft(savedQuote);
    setBaseline(savedQuote);
    setLastSavedAt(savedQuote.updatedAt);
    setFieldErrors({});
    setStatusMessage(null);
    setSentEditingUnlocked(true);
  }

  function requestStatusConfirm(
    type:
      | "returnToDraft"
      | "accepted"
      | "rejected"
      | "expired"
      | "reactivate"
      | "archive"
      | "restore",
  ) {
    if (!recalculatedDraft) return;

    const sanitized = withRecalculatedTotals({
      ...recalculatedDraft,
      lineItems: stripEmptyLines(recalculatedDraft.lineItems),
    });

    // Return to Draft is an escape hatch — do not require Final/status persist validation.
    if (type === "returnToDraft") {
      setDraft(sanitized);
      setConfirm({ type });
      return;
    }

    // Other locking transitions still require a valid persistable quote.
    const errors = validateQuoteForPersist(sanitized);
    if (hasQuoteFieldErrors(errors)) {
      applyValidationFailure(
        errors,
        firstQuoteFieldError(errors) ??
          "Fix validation errors before changing status.",
      );
      setDraft(sanitized);
      return;
    }

    setDraft(sanitized);
    setConfirm({ type });
  }

  function handleNavigate(href: string) {
    if (dirty) {
      setConfirm({ type: "leave", href });
      return;
    }
    allowLeaveRef.current = true;
    router.push(href);
  }

  function leaveTo(href: string) {
    allowLeaveRef.current = true;
    setConfirm(null);
    router.push(href);
  }

  function handleDuplicate() {
    if (!recalculatedDraft || !saved) return;

    if (dirty) {
      setConfirm({ type: "duplicateDirty" });
      return;
    }

    const preparedBy = preparedByFromSessionUser(currentUser?.fullName);
    const copy = duplicate(
      recalculatedDraft.id,
      preparedBy !== undefined ? { preparedBy } : undefined,
    );
    if (copy) {
      allowLeaveRef.current = true;
      router.push(`/quotes/${copy.id}/edit`);
    }
  }

  function handleDuplicateDirtyConfirm() {
    setConfirm(null);
    const savedQuote = persistValidatedDraft();
    if (!savedQuote) {
      setConfirm({ type: "duplicateLastSaved" });
      return;
    }
    if (mode === "create") {
      router.replace(`/quotes/${savedQuote.id}/edit`);
    }
    const preparedBy = preparedByFromSessionUser(currentUser?.fullName);
    const copy = duplicate(
      savedQuote.id,
      preparedBy !== undefined ? { preparedBy } : undefined,
    );
    if (copy) {
      allowLeaveRef.current = true;
      router.push(`/quotes/${copy.id}/edit`);
    }
  }

  function handleDuplicateLastSavedConfirm() {
    if (!recalculatedDraft) return;
    setConfirm(null);
    const preparedBy = preparedByFromSessionUser(currentUser?.fullName);
    const copy = duplicate(
      recalculatedDraft.id,
      preparedBy !== undefined ? { preparedBy } : undefined,
    );
    if (copy) {
      allowLeaveRef.current = true;
      router.push(`/quotes/${copy.id}/edit`);
    }
  }

  function handleAddCatalogItems(items: CatalogItem[]) {
    if (!draft) return;
    updateLineItems(catalogItemsToLines(items, draft.lineItems));
  }

  if (!ready || !initialized) {
    return (
      <PageContainer>
        <div className="h-10 w-48 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
        <div className="mt-6 h-96 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
      </PageContainer>
    );
  }

  if (!draft || !recalculatedDraft) {
    return (
      <PageContainer>
        <EmptyState
          title="Quote not found"
          description="This quote may have been removed or the link is invalid."
          actionLabel="Back to Quotes"
          actionHref="/quotes"
        />
      </PageContainer>
    );
  }

  const validUntilWarning = isValidUntilPast(
    recalculatedDraft.validUntil,
    today,
  );

  const suspendForDialog = Boolean(
    confirm &&
      confirm.type !== "finalPdf",
  );

  return (
    <>
      <PageContainer className="pb-28 lg:pb-8">
        <PageHeader
          title={mode === "create" ? "New Quote" : "Edit Quote"}
          description={
            mode === "create"
              ? "Build a draft quote. Nothing is saved until you choose a customer and save."
              : `Editing ${recalculatedDraft.id}`
          }
          actions={
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleNavigate("/quotes")}
            >
              Back to Quotes
            </Button>
          }
        />

        {needsSentUnlock && !sentEditingUnlocked ? (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-default bg-bg-muted px-3.5 py-2.5 text-sm text-text-secondary"
          >
            <span>
              This sent quote is read-only until you confirm editing.
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirm({ type: "sentEdit" })}
            >
              Edit quote
            </Button>
          </div>
        ) : null}

        {dirty ? (
          <div
            role="status"
            className="rounded-[var(--radius-md)] border border-border-default bg-bg-muted px-3.5 py-2.5 text-sm text-text-secondary"
          >
            Unsaved changes
          </div>
        ) : null}

        {validUntilWarning ? (
          <div
            role="status"
            className="flex items-start gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-900"
          >
            <IconAlert className="mt-0.5 shrink-0" />
            <span>
              Valid until date is in the past. Status is not changed
              automatically — update the date or mark expired when
              appropriate.
            </span>
          </div>
        ) : null}

        {statusMessage ? (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-3.5 py-3 text-sm text-danger"
          >
            {statusMessage}
          </div>
        ) : null}

        <PdfActionStatus state={pdfState} onDismiss={clearPdfState} />

        {fieldErrors.lineItems ? (
          <div
            role="alert"
            className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-3.5 py-3 text-sm text-danger"
          >
            {fieldErrors.lineItems}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_18rem] xl:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-6">
            <CustomerGate
              snapshot={recalculatedDraft.customerSnapshot}
              customerError={fieldErrors.customer}
              editable={editable}
              canChangeCustomer={canChangeCustomer}
              activeCustomers={activeCustomers}
              picking={pickingCustomer}
              onStartPick={() => setPickingCustomer(true)}
              onCancelPick={() => setPickingCustomer(false)}
              onSelectCustomer={handleSelectCustomer}
              onCreateCustomer={() => {
                setCustomerForm(emptyCustomerForm());
                setCustomerFormErrors({});
                setCustomerSlideOpen(true);
              }}
              onChangeCustomer={requestChangeCustomer}
            />

            <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-text-primary">
                  Quote Details
                </h2>
                <StatusBadge
                  label={
                    recalculatedDraft.archived
                      ? "Archived"
                      : recalculatedDraft.status
                  }
                  tone={
                    recalculatedDraft.archived
                      ? "archived"
                      : quoteStatusTone(recalculatedDraft.status)
                  }
                />
                <span className="text-sm text-text-secondary">
                  {recalculatedDraft.id}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="quote-date"
                  label="Quote Date"
                  required
                  error={fieldErrors.quoteDate}
                >
                  <Input
                    {...fieldControlProps("quote-date", fieldErrors.quoteDate)}
                    type="date"
                    value={recalculatedDraft.quoteDate}
                    disabled={!editable}
                    onChange={(event) =>
                      updateDraft({ quoteDate: event.target.value })
                    }
                  />
                </FormField>
                <FormField id="valid-until" label="Valid Until">
                  <Input
                    {...fieldControlProps("valid-until")}
                    type="date"
                    value={recalculatedDraft.validUntil ?? ""}
                    disabled={!editable}
                    onChange={(event) =>
                      updateDraft({
                        validUntil: event.target.value || null,
                      })
                    }
                  />
                </FormField>
                <FormField id="prepared-by" label="Prepared By">
                  <Input
                    {...fieldControlProps("prepared-by")}
                    value={recalculatedDraft.preparedBy}
                    disabled={
                      !editable || !capabilities.canOverridePreparedBy
                    }
                    onChange={(event) =>
                      updateDraft({ preparedBy: event.target.value })
                    }
                  />
                </FormField>
                <FormField
                  id="job-description"
                  label="Job Description"
                  required
                  error={fieldErrors.jobDescription}
                  className="sm:col-span-2"
                >
                  <Textarea
                    {...fieldControlProps(
                      "job-description",
                      fieldErrors.jobDescription,
                    )}
                    rows={3}
                    value={recalculatedDraft.jobDescription}
                    disabled={!editable}
                    onChange={(event) =>
                      updateDraft({ jobDescription: event.target.value })
                    }
                  />
                </FormField>
              </div>
            </section>

            <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between px-4 py-3 text-left"
                onClick={() => setDetailsOpen((open) => !open)}
                aria-expanded={detailsOpen}
              >
                <span className="text-sm font-semibold text-text-primary">
                  Additional Details
                </span>
                <span className="text-sm text-text-secondary">
                  {detailsOpen ? "Hide" : "Show"}
                </span>
              </button>
              {detailsOpen ? (
                <div className="space-y-4 border-t border-border-default px-4 py-4">
                  <FormField
                    id="internal-notes"
                    label="Internal Notes"
                    hint="Employees only — never shown on customer-facing quotes."
                  >
                    <Textarea
                      {...fieldControlProps(
                        "internal-notes",
                        undefined,
                        "Employees only — never shown on customer-facing quotes.",
                      )}
                      rows={3}
                      value={recalculatedDraft.internalNotes}
                      disabled={!editable}
                      onChange={(event) =>
                        updateDraft({ internalNotes: event.target.value })
                      }
                    />
                  </FormField>
                  <FormField
                    id="customer-message"
                    label="Customer-Facing Message"
                  >
                    <Textarea
                      {...fieldControlProps("customer-message")}
                      rows={3}
                      value={recalculatedDraft.customerFacingMessage}
                      disabled={!editable}
                      onChange={(event) =>
                        updateDraft({
                          customerFacingMessage: event.target.value,
                        })
                      }
                    />
                  </FormField>
                  <FormField id="terms" label="Terms and Conditions">
                    <Textarea
                      {...fieldControlProps("terms")}
                      rows={4}
                      value={recalculatedDraft.termsAndConditions}
                      disabled={!editable}
                      onChange={(event) =>
                        updateDraft({
                          termsAndConditions: event.target.value,
                        })
                      }
                    />
                  </FormField>
                </div>
              ) : null}
            </section>

            <LineItemsEditor
              lines={recalculatedDraft.lineItems}
              editable={editable}
              lineErrors={fieldErrors.lines}
              onChange={updateLineItems}
              onOpenCatalog={() => setCatalogOpen(true)}
            />
          </div>

          <QuoteTotalsPanel
            quote={recalculatedDraft}
            editable={editable}
            saved={saved}
            saving={saving}
            discountError={fieldErrors.discountValue}
            taxRateError={fieldErrors.taxRate}
            lastSavedAt={
              lastSavedAt ? formatShortDate(lastSavedAt) : null
            }
            onDiscountTypeChange={(discountType) =>
              updateDraft({
                discountType,
                discountValue:
                  discountType === "none"
                    ? 0
                    : recalculatedDraft.discountValue,
              })
            }
            onDiscountValueChange={(discountValue) =>
              updateDraft({ discountValue })
            }
            onTaxRateChange={(taxRate) => updateDraft({ taxRate })}
            onSaveDraft={handleSaveDraft}
            pdfBusy={pdfBusy}
            onPreviewPdf={handlePreviewPdf}
            onFinalPdf={handleFinalPdf}
            onMarkSent={handleMarkSent}
            onReturnToDraft={() => requestStatusConfirm("returnToDraft")}
            onAccepted={() => requestStatusConfirm("accepted")}
            onRejected={() => requestStatusConfirm("rejected")}
            onExpired={() => requestStatusConfirm("expired")}
            onReactivate={() => requestStatusConfirm("reactivate")}
            onArchive={() => requestStatusConfirm("archive")}
            onRestore={() => requestStatusConfirm("restore")}
            onDuplicate={handleDuplicate}
            canRestore={capabilities.canRestore}
            canOverrideQuoteStatus={capabilities.canOverrideQuoteStatus}
          />
        </div>
      </PageContainer>

      <CatalogPicker
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        onAdd={handleAddCatalogItems}
      />

      <SlideOver
        open={customerSlideOpen}
        title="Create Customer"
        description="Add a new customer for this quote."
        onClose={() => setCustomerSlideOpen(false)}
        suspendInteractions={suspendForDialog}
        footer={
          <CustomerFormFooter
            formId="quote-builder-customer-form"
            onCancel={() => setCustomerSlideOpen(false)}
          />
        }
      >
        <CustomerForm
          formId="quote-builder-customer-form"
          values={customerForm}
          errors={customerFormErrors}
          onChange={setCustomerForm}
          onSubmit={handleCreateCustomerSubmit}
        />
      </SlideOver>

      <ConfirmDialog
        open={confirm?.type === "sentEdit"}
        title="Edit sent quote?"
        description="This quote has already been sent to the customer. Continue editing?"
        confirmLabel="Continue editing"
        cancelLabel="Keep read-only"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setSentEditingUnlocked(true);
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "leave"}
        title="Leave without saving?"
        description="You have unsaved changes. Leave this page and discard them?"
        confirmLabel="Leave"
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          const href = confirm?.type === "leave" ? confirm.href : "/quotes";
          leaveTo(href);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "changeCustomerSent"}
        title="Change customer on sent quote?"
        description="This quote has already been marked Sent. Changing the customer may affect records sent to the client. Continue?"
        confirmLabel="Change Customer"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          setPickingCustomer(true);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "duplicateDirty"}
        title="Duplicate with unsaved changes?"
        description="Your current edits are not saved yet. Save them first, then duplicate the saved quote."
        confirmLabel="Save & Duplicate"
        cancelLabel="Cancel"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={handleDuplicateDirtyConfirm}
      />

      <ConfirmDialog
        open={confirm?.type === "duplicateLastSaved"}
        title="Duplicate last saved version?"
        description="Your unsaved changes could not be saved because of validation errors. Duplicate the last saved version instead? Unsaved changes will not be copied."
        confirmLabel="Duplicate last saved"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={handleDuplicateLastSavedConfirm}
      />

      <ConfirmDialog
        open={confirm?.type === "markSent"}
        title="Mark quote as Sent?"
        description="The quote will be marked Sent, today’s Sent Date will be recorded, and a frozen PDF snapshot will be saved. No PDF file will be generated. Use Final PDF if you also need the customer document."
        confirmLabel="Mark as Sent"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate((quote, day) => {
            const frozenAt = toIsoDate(startOfDay(day));
            const snapshot = createQuotePdfSnapshot(quote, settings, frozenAt);
            return markQuoteSent(quote, day, snapshot);
          });
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "finalPdf"}
        title="Generate Final PDF and mark Sent?"
        description="This saves the current quote, freezes a customer PDF snapshot, marks the quote as Sent, records today’s Sent Date, and opens the Final PDF (no DRAFT watermark)."
        confirmLabel="Generate Final PDF"
        cancelLabel="Cancel"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          void confirmFinalPdfAndSend();
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "returnToDraft"}
        title="Return to Draft?"
        description="This moves the quote back to Draft and clears the frozen sent PDF snapshot so a later Final PDF or Mark as Sent creates a new official version."
        confirmLabel="Return to Draft"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={confirmReturnToDraft}
      />

      <ConfirmDialog
        open={confirm?.type === "accepted"}
        title="Mark as Accepted?"
        description="This records customer acceptance. The quote will become read-only."
        confirmLabel="Mark Accepted"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate(markQuoteAccepted);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "rejected"}
        title="Mark as Rejected?"
        description="This records that the customer declined the quote."
        confirmLabel="Mark Rejected"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate(markQuoteRejected);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "expired"}
        title="Mark as Expired?"
        description="This marks the quote as expired."
        confirmLabel="Mark Expired"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate(markQuoteExpired);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "reactivate"}
        title="Reactivate quote?"
        description={`This returns the quote to Draft and extends valid until by ${getQuoteDefaults().quoteValidityDays} days.`}
        confirmLabel="Reactivate"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          const defaults = getQuoteDefaults();
          persistAndMutate((quote, day) =>
            reactivateQuoteToDraft(quote, day, defaults),
          );
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "archive"}
        title="Archive quote?"
        description="Archived quotes are hidden from the active list but can be restored."
        confirmLabel="Archive"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate(archiveQuote);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "restore"}
        title="Restore quote?"
        description="This restores the quote to the active list with its previous status."
        confirmLabel="Restore"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          persistAndMutate(restoreQuote);
        }}
      />
    </>
  );
}

export function NewQuotePageContent() {
  const searchParams = useSearchParams();
  const customer = searchParams.get("customer");
  return <QuoteBuilderView mode="create" initialCustomerId={customer} />;
}
