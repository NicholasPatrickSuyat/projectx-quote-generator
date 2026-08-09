"use client";

import { QuoteBulkBar } from "@/components/quotes/quote-bulk-bar";
import { QuoteFilterChips } from "@/components/quotes/quote-filter-chips";
import { QuoteSummary } from "@/components/quotes/quote-summary";
import { IconFileText, IconPlus, IconSearch } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import {
  ActiveArchivedToggle,
  FilterBar,
} from "@/components/ui/filter-bar";
import { Button, buttonClassName } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/input";
import {
  RowActionsMenu,
  RowActionsMenuSlot,
} from "@/components/ui/row-actions-menu";
import { SearchInput } from "@/components/ui/search-input";
import { SlideOver } from "@/components/ui/slide-over";
import { StatusBadge } from "@/components/ui/status-badge";
import { useQuoteSession } from "@/components/session/quote-session-provider";
import { DATE_PRESETS, type DatePresetId } from "@/lib/dashboard/date-presets";
import { cn } from "@/lib/cn";
import { findCustomerSnapshot } from "@/lib/quotes/demo-data";
import { parseQuotesSearchParams } from "@/lib/quotes/deep-links";
import {
  clearQuoteFilterChip,
  DEFAULT_QUOTE_FILTERS,
  distinctCustomerNames,
  filterQuotes,
  getActiveQuoteFilterChips,
  sortQuotes,
  type QuoteFilters,
  type QuoteSortKey,
} from "@/lib/quotes/filters";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { quoteStatusTone, QUOTE_STATUSES, type Quote } from "@/types/quote";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PanelMode = "closed" | "summary";

type ConfirmState =
  | { type: "archive"; quote: Quote }
  | { type: "restore"; quote: Quote }
  | { type: "bulk-archive" }
  | { type: "bulk-restore" }
  | { type: "pdf" }
  | null;

const SORT_COLUMN_MAP: Record<string, QuoteSortKey> = {
  quoteId: "quoteId",
  customer: "customer",
  job: "job",
  status: "status",
  quoteDate: "quoteDate",
  validUntil: "validUntil",
  grandTotal: "grandTotal",
  preparedBy: "preparedBy",
};

function resolveCustomerFilterName(
  quotes: Quote[],
  customerId: string | null,
  existingName: string | "all",
): string | "all" {
  if (existingName !== "all") return existingName;
  if (!customerId) return "all";
  const fromQuotes = quotes.find(
    (quote) => quote.customerSnapshot?.customerId === customerId,
  );
  if (fromQuotes?.customerSnapshot) {
    return fromQuotes.customerSnapshot.customerName;
  }
  const fromDemo = findCustomerSnapshot(customerId);
  return fromDemo?.customerName ?? "all";
}

export function QuotesView() {
  const {
    ready,
    today,
    quotes,
    archive,
    restore,
    duplicate,
  } = useQuoteSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [filters, setFilters] = useState<QuoteFilters>(DEFAULT_QUOTE_FILTERS);
  const [sortKey, setSortKey] = useState<QuoteSortKey>("quoteDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [appliedSearchKey, setAppliedSearchKey] = useState<string | null>(null);

  const searchKey = searchParams.toString();
  const seeded = ready;

  if (ready && today && appliedSearchKey !== searchKey) {
    setAppliedSearchKey(searchKey);
    const parsed = parseQuotesSearchParams(searchParams);

    if (!parsed.create) {
      const customerName = resolveCustomerFilterName(
        quotes,
        parsed.customerId,
        parsed.filters.customerName,
      );
      setFilters({ ...parsed.filters, customerName });

      if (parsed.filters.attention === "awaiting-response") {
        setSortKey("sentAt");
        setSortDir("desc");
      }

      const openId = searchParams.get("id");
      if (openId && quotes.some((quote) => quote.id === openId)) {
        setSelectedId(openId);
        setPanelMode("summary");
      }
    }
  }

  const createRedirect = useMemo(() => {
    if (!ready) return null;
    const parsed = parseQuotesSearchParams(searchParams);
    if (!parsed.create) return null;
    return parsed.customerId
      ? `/quotes/new?customer=${parsed.customerId}`
      : "/quotes/new";
  }, [ready, searchParams]);

  useEffect(() => {
    if (!createRedirect) return;
    router.replace(createRedirect);
  }, [createRedirect, router]);

  const selectedQuote = useMemo(
    () => quotes.find((quote) => quote.id === selectedId) ?? null,
    [quotes, selectedId],
  );

  const customerOptions = useMemo(
    () => distinctCustomerNames(quotes),
    [quotes],
  );

  const visibleQuotes = useMemo(() => {
    if (!today) return [];
    const filtered = filterQuotes(quotes, filters, today);
    return sortQuotes(filtered, sortKey, sortDir);
  }, [quotes, filters, today, sortKey, sortDir]);

  const filterChips = useMemo(
    () => getActiveQuoteFilterChips(filters),
    [filters],
  );

  const visibleIdSet = useMemo(
    () => new Set(visibleQuotes.map((quote) => quote.id)),
    [visibleQuotes],
  );

  const selectedVisibleCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      if (visibleIdSet.has(id)) count += 1;
    }
    return count;
  }, [selectedIds, visibleIdSet]);

  const allVisibleSelected =
    visibleQuotes.length > 0 &&
    visibleQuotes.every((quote) => selectedIds.has(quote.id));

  function clearFilters() {
    setFilters(DEFAULT_QUOTE_FILTERS);
  }

  function openSummary(quote: Quote) {
    setSelectedId(quote.id);
    setPanelMode("summary");
  }

  function closePanel() {
    setPanelMode("closed");
    setSelectedId(null);
  }

  function handleSort(columnId: string) {
    const nextKey = SORT_COLUMN_MAP[columnId];
    if (!nextKey) return;
    if (sortKey === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(
      nextKey === "quoteDate" ||
        nextKey === "validUntil" ||
        nextKey === "sentAt" ||
        nextKey === "grandTotal"
        ? "desc"
        : "asc",
    );
  }

  function visibleSelectedIds(): string[] {
    return [...selectedIds].filter((id) => visibleIdSet.has(id));
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const quote of visibleQuotes) next.delete(quote.id);
      } else {
        for (const quote of visibleQuotes) next.add(quote.id);
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleCreate() {
    router.push("/quotes/new");
  }

  function handleEdit(quote: Quote) {
    router.push(`/quotes/${quote.id}/edit`);
  }

  function handleDuplicate(quote: Quote) {
    const copy = duplicate(quote.id);
    if (copy) {
      router.push(`/quotes/${copy.id}/edit`);
    }
  }

  function applyArchive(quote: Quote) {
    archive(quote.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(quote.id);
      return next;
    });
  }

  function applyRestore(quote: Quote) {
    restore(quote.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(quote.id);
      return next;
    });
  }

  function applyBulkArchive() {
    const ids = visibleSelectedIds();
    if (ids.length === 0) return;
    for (const id of ids) {
      const quote = quotes.find((item) => item.id === id);
      if (quote && !quote.archived) archive(id);
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  function applyBulkRestore() {
    const ids = visibleSelectedIds();
    if (ids.length === 0) return;
    for (const id of ids) {
      const quote = quotes.find((item) => item.id === id);
      if (quote && quote.archived) restore(id);
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }

  function confirmPrimary() {
    if (!confirm) return;
    switch (confirm.type) {
      case "archive":
        applyArchive(confirm.quote);
        break;
      case "restore":
        applyRestore(confirm.quote);
        break;
      case "bulk-archive":
        applyBulkArchive();
        break;
      case "bulk-restore":
        applyBulkRestore();
        break;
      case "pdf":
        break;
    }
    setConfirm(null);
  }

  const hasRestrictiveFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.customerName !== "all" ||
    filters.datePreset !== "all" ||
    filters.expiringSoon ||
    filters.attention !== null;

  const showActiveZeroEmpty =
    seeded &&
    filters.archive === "active" &&
    quotes.every((quote) => quote.archived) &&
    !hasRestrictiveFilters;

  const showArchivedZeroEmpty =
    seeded &&
    filters.archive === "archived" &&
    quotes.every((quote) => !quote.archived) &&
    !hasRestrictiveFilters;

  const showFilteredEmpty =
    seeded &&
    visibleQuotes.length === 0 &&
    !showActiveZeroEmpty &&
    !showArchivedZeroEmpty;

  const showDefaultEmpty =
    seeded &&
    visibleQuotes.length === 0 &&
    filters.archive === "active" &&
    !hasRestrictiveFilters &&
    quotes.length === 0;

  const columns: DataTableColumn<Quote>[] = [
    {
      id: "select",
      header: "",
      headerClassName: "w-10",
      className: "w-10",
      cell: (row) => (
        <input
          type="checkbox"
          className="size-4 rounded border-border-default text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover"
          checked={selectedIds.has(row.id)}
          aria-label={`Select ${row.id}`}
          onClick={(event) => event.stopPropagation()}
          onChange={() => toggleSelect(row.id)}
        />
      ),
    },
    {
      id: "quoteId",
      header: "Quote ID",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-text-primary tabular-nums">
          {row.id}
        </span>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      sortable: true,
      cell: (row) => (
        <span className="block max-w-[12rem] truncate">
          {row.customerSnapshot?.customerName ?? "—"}
        </span>
      ),
    },
    {
      id: "job",
      header: "Job",
      sortable: true,
      cell: (row) => (
        <span className="block max-w-[14rem] truncate text-text-secondary">
          {row.jobDescription || "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          label={row.archived ? "Archived" : row.status}
          tone={row.archived ? "archived" : quoteStatusTone(row.status)}
        />
      ),
    },
    {
      id: "quoteDate",
      header: "Quote Date",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums text-text-secondary">
          {formatShortDate(row.quoteDate)}
        </span>
      ),
    },
    {
      id: "validUntil",
      header: "Valid Until",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums text-text-secondary">
          {row.validUntil ? formatShortDate(row.validUntil) : "—"}
        </span>
      ),
    },
    {
      id: "grandTotal",
      header: "Grand Total",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums font-medium text-text-primary">
          {formatCurrency(row.grandTotal)}
        </span>
      ),
    },
    {
      id: "preparedBy",
      header: "Prepared By",
      sortable: true,
      cell: (row) => (
        <span className="text-text-secondary">{row.preparedBy}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <RowActionsMenuSlot>
          <RowActionsMenu
            label={`Actions for ${row.id}`}
            items={[
              {
                id: "open",
                label: "Open",
                onSelect: () => openSummary(row),
              },
              {
                id: "edit",
                label: "Edit",
                onSelect: () => handleEdit(row),
              },
              {
                id: "duplicate",
                label: "Duplicate",
                onSelect: () => handleDuplicate(row),
              },
              {
                id: "pdf",
                label: "Generate PDF",
                onSelect: () => setConfirm({ type: "pdf" }),
              },
              row.archived
                ? {
                    id: "restore",
                    label: "Restore",
                    onSelect: () =>
                      setConfirm({ type: "restore", quote: row }),
                  }
                : {
                    id: "archive",
                    label: "Archive",
                    tone: "danger",
                    onSelect: () =>
                      setConfirm({ type: "archive", quote: row }),
                  },
            ]}
          />
        </RowActionsMenuSlot>
      ),
    },
  ];

  const panelOpen = panelMode === "summary" && selectedQuote !== null;

  const confirmCopy = (() => {
    if (!confirm) return null;
    switch (confirm.type) {
      case "archive":
        return {
          title: "Archive quote?",
          description: `${confirm.quote.id} will move to the Archived list. You can restore it later.`,
          confirmLabel: "Archive",
          tone: "danger" as const,
        };
      case "restore":
        return {
          title: "Restore quote?",
          description: `${confirm.quote.id} will return to ${confirm.quote.statusBeforeArchive ?? "Draft"} status.`,
          confirmLabel: "Restore",
          tone: "primary" as const,
        };
      case "bulk-archive":
        return {
          title: "Archive selected quotes?",
          description: `${selectedVisibleCount} quote${selectedVisibleCount === 1 ? "" : "s"} will move to the Archived list.`,
          confirmLabel: "Archive",
          tone: "danger" as const,
        };
      case "bulk-restore":
        return {
          title: "Restore selected quotes?",
          description: `${selectedVisibleCount} quote${selectedVisibleCount === 1 ? "" : "s"} will return to their previous status.`,
          confirmLabel: "Restore",
          tone: "primary" as const,
        };
      case "pdf":
        return {
          title: "Generate PDF",
          description:
            "PDF generation will be available in the PDF milestone.",
          confirmLabel: "Got it",
          tone: "primary" as const,
        };
    }
  })();

  return (
    <PageContainer className="gap-6" aria-busy={seeded ? undefined : true}>
      <PageHeader
        title="Quotes"
        description="Browse and manage quotes for your customers."
        actions={
          <Button type="button" onClick={handleCreate}>
            <IconPlus className="size-4" />
            New Quote
          </Button>
        }
      />

      <FilterBar>
        <div className="w-full sm:max-w-sm">
          <SearchInput
            label="Search quotes"
            placeholder="Search quote ID, customer, job, prepared by…"
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
            leadingIcon={<IconSearch className="size-4" />}
          />
        </div>
        <ActiveArchivedToggle
          ariaLabel="Quote archive status"
          value={filters.archive}
          onChange={(archive) => {
            setFilters((prev) => ({ ...prev, archive }));
            clearSelection();
          }}
        />
        <Select
          aria-label="Filter by status"
          className="w-full sm:w-40"
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value as QuoteFilters["status"],
            }))
          }
        >
          <option value="all">All statuses</option>
          {QUOTE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by customer"
          className="w-full sm:w-48"
          value={filters.customerName}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              customerName: event.target.value,
            }))
          }
        >
          <option value="all">All customers</option>
          {customerOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by quote date"
          className="w-full sm:w-44"
          value={filters.datePreset}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              datePreset: event.target.value as DatePresetId | "all",
            }))
          }
        >
          <option value="all">All quote dates</option>
          {DATE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </Select>
        <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-border-default bg-bg-surface px-3 text-sm text-text-primary shadow-sm">
          <input
            type="checkbox"
            className="size-4 rounded border-border-default text-primary"
            checked={filters.expiringSoon}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                expiringSoon: event.target.checked,
              }))
            }
          />
          Expiring Soon
        </label>
        {filterChips.length > 0 ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </FilterBar>

      <QuoteFilterChips
        chips={filterChips}
        onRemove={(chipId) =>
          setFilters((prev) => clearQuoteFilterChip(prev, chipId))
        }
        onClearAll={clearFilters}
      />

      {visibleQuotes.length > 0 ? (
        <div className="hidden items-center gap-2 md:flex">
          <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="size-4 rounded border-border-default text-primary"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              aria-label="Select all visible quotes"
            />
            Select all
          </label>
          <span className="text-sm text-text-muted">
            {visibleQuotes.length} quote{visibleQuotes.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      <div className="hidden md:block">
        {showDefaultEmpty || showActiveZeroEmpty ? (
          <EmptyState
            icon={<IconFileText />}
            title="No quotes found."
            description="Create a draft quote to get started, or open Customers to pick who you are quoting."
            actionLabel="New Quote"
            onAction={handleCreate}
            secondaryLabel="View Customers"
            onSecondary={() => router.push("/customers")}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived quotes"
            description="Archived quotes will appear here. Active quotes stay in the Active list."
            actionLabel="View Active quotes"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No quotes match these filters"
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel="New Quote"
            onSecondary={handleCreate}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={visibleQuotes}
            getRowId={(row) => row.id}
            sortColumn={sortKey}
            sortDirection={sortDir}
            onSort={handleSort}
            onRowClick={openSummary}
          />
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {showDefaultEmpty || showActiveZeroEmpty ? (
          <EmptyState
            icon={<IconFileText />}
            title="No quotes found."
            description="Create a draft quote to get started, or open Customers to pick who you are quoting."
            actionLabel="New Quote"
            onAction={handleCreate}
            secondaryLabel="View Customers"
            onSecondary={() => router.push("/customers")}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived quotes"
            description="Archived quotes will appear here. Active quotes stay in the Active list."
            actionLabel="View Active quotes"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No quotes match these filters"
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel="New Quote"
            onSecondary={handleCreate}
          />
        ) : (
          visibleQuotes.map((quote) => {
            const selected = selectedIds.has(quote.id);
            return (
              <article
                key={quote.id}
                className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => openSummary(quote)}
                  >
                    <p className="font-semibold text-text-primary tabular-nums">
                      {quote.id}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-text-secondary">
                      {quote.customerSnapshot?.customerName ?? "—"}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-text-secondary">
                      {quote.jobDescription || "No job description"}
                    </p>
                  </button>
                  <RowActionsMenu
                    label={`Actions for ${quote.id}`}
                    items={[
                      {
                        id: "open",
                        label: "Open",
                        onSelect: () => openSummary(quote),
                      },
                      {
                        id: "edit",
                        label: "Edit",
                        onSelect: () => handleEdit(quote),
                      },
                      {
                        id: "duplicate",
                        label: "Duplicate",
                        onSelect: () => handleDuplicate(quote),
                      },
                      {
                        id: "pdf",
                        label: "Generate PDF",
                        onSelect: () => setConfirm({ type: "pdf" }),
                      },
                      quote.archived
                        ? {
                            id: "restore",
                            label: "Restore",
                            onSelect: () =>
                              setConfirm({ type: "restore", quote }),
                          }
                        : {
                            id: "archive",
                            label: "Archive",
                            tone: "danger",
                            onSelect: () =>
                              setConfirm({ type: "archive", quote }),
                          },
                    ]}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={quote.archived ? "Archived" : quote.status}
                    tone={
                      quote.archived
                        ? "archived"
                        : quoteStatusTone(quote.status)
                    }
                  />
                  <span className="text-sm font-medium tabular-nums text-text-primary">
                    {formatCurrency(quote.grandTotal)}
                  </span>
                  <span className="text-xs text-text-secondary tabular-nums">
                    {formatShortDate(quote.quoteDate)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleSelect(quote.id)}
                    className={cn(
                      buttonClassName({ variant: "secondary", size: "sm" }),
                      selected && "border-primary text-primary",
                    )}
                  >
                    {selected ? "Selected" : "Select"}
                  </button>
                  <span className="text-xs text-text-secondary">
                    {quote.preparedBy}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>

      <QuoteBulkBar
        selectedCount={selectedVisibleCount}
        archiveMode={filters.archive === "archived"}
        onArchive={() => setConfirm({ type: "bulk-archive" })}
        onRestore={() => setConfirm({ type: "bulk-restore" })}
        onClear={clearSelection}
      />

      <SlideOver
        open={panelOpen}
        title={selectedQuote?.id ?? "Quote"}
        description={
          selectedQuote
            ? `${selectedQuote.customerSnapshot?.customerName ?? "No customer"} · ${selectedQuote.archived ? "Archived" : selectedQuote.status}`
            : undefined
        }
        onClose={closePanel}
        suspendInteractions={confirm !== null}
        wide
      >
        {selectedQuote ? (
          <QuoteSummary
            quote={selectedQuote}
            onDuplicate={() => handleDuplicate(selectedQuote)}
            onArchive={() =>
              setConfirm({ type: "archive", quote: selectedQuote })
            }
            onRestore={() =>
              setConfirm({ type: "restore", quote: selectedQuote })
            }
            onGeneratePdf={() => setConfirm({ type: "pdf" })}
            onEdit={() => handleEdit(selectedQuote)}
          />
        ) : null}
      </SlideOver>

      {confirm && confirmCopy ? (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          cancelLabel={confirm.type === "pdf" ? "Close" : "Cancel"}
          tone={confirmCopy.tone}
          onConfirm={confirmPrimary}
          onCancel={() => setConfirm(null)}
        />
      ) : null}

      {!seeded ? (
        <p className="sr-only">Loading quotes…</p>
      ) : null}
    </PageContainer>
  );
}
