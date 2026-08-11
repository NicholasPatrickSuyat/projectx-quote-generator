"use client";

import { CatalogForm, CatalogFormFooter } from "@/components/catalog/catalog-form";
import { CatalogSummary } from "@/components/catalog/catalog-summary";
import { IconPlus, IconSearch } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { useCatalogSession } from "@/components/session/catalog-session-provider";
import { useUnsavedNavigationGuard } from "@/lib/navigation/use-unsaved-navigation-guard";
import {
  ActiveArchivedToggle,
  FilterBar,
} from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
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
import {
  catalogToFormValues,
  emptyCatalogForm,
} from "@/lib/catalog/demo-data";
import {
  DEFAULT_CATALOG_FILTERS,
  filterCatalogItems,
  hasActiveListFilters,
  validateCatalogForm,
  type CatalogFieldErrors,
  type CatalogFilters,
  type CatalogSortOption,
} from "@/lib/catalog/filters";
import { formatCurrency, formatShortDate } from "@/lib/format";
import {
  catalogRecordStatus,
  type CatalogFormValues,
  type CatalogItem,
} from "@/types/catalog";
import { LINE_CATEGORIES } from "@/types/quote";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PanelMode = "closed" | "summary" | "create" | "edit";

type PendingNavigation =
  | { type: "close" }
  | { type: "summary"; item: CatalogItem }
  | { type: "create" }
  | { type: "edit"; item: CatalogItem }
  | { type: "duplicate"; item: CatalogItem }
  | { type: "archive"; item: CatalogItem }
  | { type: "restore"; item: CatalogItem };

type ConfirmState =
  | { type: "archive"; item: CatalogItem }
  | { type: "restore"; item: CatalogItem }
  | { type: "discard"; pending: PendingNavigation }
  | null;

const SORT_COLUMN_MAP: Record<string, CatalogSortOption> = {
  name: "name",
  category: "category",
  price: "price",
  status: "status",
  updated: "updated",
};

function formsEqual(a: CatalogFormValues, b: CatalogFormValues): boolean {
  return (
    a.name === b.name &&
    a.category === b.category &&
    a.unit === b.unit &&
    a.unitPrice === b.unitPrice &&
    a.description === b.description
  );
}

export function CatalogView() {
  const {
    ready,
    items,
    canManageCatalog,
    createItem,
    updateItem,
    duplicateItem,
    archiveItem,
    restoreItem,
  } = useCatalogSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const seeded = ready;
  const [filters, setFilters] = useState<CatalogFilters>(DEFAULT_CATALOG_FILTERS);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CatalogFormValues>(emptyCatalogForm());
  const [baselineForm, setBaselineForm] = useState<CatalogFormValues>(emptyCatalogForm());
  const [errors, setErrors] = useState<CatalogFieldErrors>({});
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [createDeepLinkHandled, setCreateDeepLinkHandled] = useState(false);
  const [shouldClearCreateParam, setShouldClearCreateParam] = useState(false);

  if (
    seeded &&
    canManageCatalog &&
    !createDeepLinkHandled &&
    searchParams.get("create") === "1"
  ) {
    setCreateDeepLinkHandled(true);
    setShouldClearCreateParam(true);
    setSelectedId(null);
    setFormValues(emptyCatalogForm());
    setBaselineForm(emptyCatalogForm());
    setErrors({});
    setPanelMode("create");
  }

  useEffect(() => {
    if (!shouldClearCreateParam) return;
    router.replace("/catalog", { scroll: false });
  }, [shouldClearCreateParam, router]);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const visibleItems = useMemo(
    () => filterCatalogItems(items, filters),
    [items, filters],
  );

  const dirty = !formsEqual(formValues, baselineForm);
  const formIsOpen = panelMode === "create" || panelMode === "edit";
  const formId = "catalog-form";
  const { leaveDialog, isLeavePromptOpen } = useUnsavedNavigationGuard({
    isDirty: formIsOpen && dirty,
  });

  function forceOpenCreate() {
    const blank = emptyCatalogForm();
    setSelectedId(null);
    setFormValues(blank);
    setBaselineForm(blank);
    setErrors({});
    setPanelMode("create");
  }

  function forceOpenSummary(item: CatalogItem) {
    setSelectedId(item.id);
    setErrors({});
    setFormValues(emptyCatalogForm());
    setBaselineForm(emptyCatalogForm());
    setPanelMode("summary");
  }

  function forceOpenEdit(item: CatalogItem) {
    const values = catalogToFormValues(item);
    setSelectedId(item.id);
    setFormValues(values);
    setBaselineForm(values);
    setErrors({});
    setPanelMode("edit");
  }

  function closePanel() {
    setPanelMode("closed");
    setSelectedId(null);
    setErrors({});
    setFormValues(emptyCatalogForm());
    setBaselineForm(emptyCatalogForm());
  }

  function applyPendingNavigation(pending: PendingNavigation) {
    switch (pending.type) {
      case "close":
        closePanel();
        break;
      case "summary":
        forceOpenSummary(pending.item);
        break;
      case "create":
        forceOpenCreate();
        break;
      case "edit":
        forceOpenEdit(pending.item);
        break;
      case "duplicate": {
        const copy = duplicateItem(pending.item.id);
        if (copy) forceOpenSummary(copy);
        break;
      }
      case "archive":
        forceOpenSummary(pending.item);
        setConfirm({ type: "archive", item: pending.item });
        break;
      case "restore":
        forceOpenSummary(pending.item);
        setConfirm({ type: "restore", item: pending.item });
        break;
    }
  }

  function requestNavigation(pending: PendingNavigation) {
    if (formIsOpen && dirty) {
      setConfirm({ type: "discard", pending });
      return;
    }
    applyPendingNavigation(pending);
  }

  function openCreate() {
    if (!canManageCatalog) return;
    requestNavigation({ type: "create" });
  }

  function openSummary(item: CatalogItem) {
    requestNavigation({ type: "summary", item });
  }

  function openEdit(item: CatalogItem) {
    if (!canManageCatalog) return;
    requestNavigation({ type: "edit", item });
  }

  function requestClosePanel() {
    requestNavigation({ type: "close" });
  }

  function requestArchive(item: CatalogItem) {
    if (!canManageCatalog) return;
    requestNavigation({ type: "archive", item });
  }

  function requestRestore(item: CatalogItem) {
    if (!canManageCatalog) return;
    requestNavigation({ type: "restore", item });
  }

  function saveItem() {
    if (!canManageCatalog) return;
    const nextErrors = validateCatalogForm(formValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    const trimmed: CatalogFormValues = {
      name: formValues.name.trim(),
      category: formValues.category,
      unit: formValues.unit.trim(),
      unitPrice: formValues.unitPrice,
      description: formValues.description.trim(),
    };

    if (panelMode === "create") {
      const created = createItem(trimmed);
      setSelectedId(created.id);
      setPanelMode("summary");
      setBaselineForm(catalogToFormValues(created));
      setFormValues(catalogToFormValues(created));
      return;
    }

    if (panelMode === "edit" && selectedId) {
      const updated = updateItem(selectedId, trimmed);
      if (updated) {
        setPanelMode("summary");
        setBaselineForm(catalogToFormValues(updated));
        setFormValues(catalogToFormValues(updated));
      }
    }
  }

  function handleDuplicate(item: CatalogItem) {
    if (!canManageCatalog) return;
    requestNavigation({ type: "duplicate", item });
  }

  function handleArchive(item: CatalogItem) {
    if (!canManageCatalog) return;
    archiveItem(item.id);
    if (selectedId === item.id) {
      const current = items.find((entry) => entry.id === item.id);
      forceOpenSummary(
        current
          ? { ...current, archived: true }
          : { ...item, archived: true },
      );
    }
  }

  function handleRestore(item: CatalogItem) {
    if (!canManageCatalog) return;
    restoreItem(item.id);
    if (selectedId === item.id) {
      const current = items.find((entry) => entry.id === item.id);
      forceOpenSummary(
        current
          ? { ...current, archived: false }
          : { ...item, archived: false },
      );
    }
  }

  function handleSort(columnId: string) {
    const sort = SORT_COLUMN_MAP[columnId];
    if (!sort) return;
    setFilters((prev) => {
      if (prev.sort === sort) {
        return {
          ...prev,
          sortDir: prev.sortDir === "asc" ? "desc" : "asc",
        };
      }
      return {
        ...prev,
        sort,
        sortDir: sort === "updated" ? "desc" : "asc",
      };
    });
  }

  function clearFilters() {
    setFilters((prev) => ({
      ...DEFAULT_CATALOG_FILTERS,
      archive: prev.archive,
    }));
  }

  const columns: DataTableColumn<CatalogItem>[] = [
    {
      id: "name",
      header: "Service Name",
      sortable: true,
      cell: (row) => (
        <div className="min-w-[10rem]">
          <p className="font-medium text-text-primary">{row.name}</p>
          <p className="font-mono text-xs tabular-nums text-text-secondary">
            {row.id}
          </p>
        </div>
      ),
    },
    {
      id: "category",
      header: "Category",
      sortable: true,
      cell: (row) => (
        <span className="text-text-primary">{row.category}</span>
      ),
    },
    {
      id: "unit",
      header: "Unit",
      cell: (row) => (
        <span className="text-text-primary">{row.unit.trim() || "—"}</span>
      ),
    },
    {
      id: "price",
      header: "Default Price",
      sortable: true,
      className: "text-right",
      headerClassName: "text-right",
      cell: (row) => (
        <span className="tabular-nums text-text-primary">
          {formatCurrency(row.unitPrice)}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => {
        const status = catalogRecordStatus(row);
        return (
          <StatusBadge
            label={status}
            tone={status === "Active" ? "active" : "archived"}
          />
        );
      },
    },
    {
      id: "updated",
      header: "Last Updated",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums text-text-secondary">
          {formatShortDate(row.updatedAt)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "sr-only",
      className: "text-right",
      cell: (row) => (
        <RowActionsMenuSlot>
          <RowActionsMenu
            label={`Actions for ${row.name}`}
            items={[
              {
                id: "open",
                label: "Open",
                onSelect: () => openSummary(row),
              },
              ...(canManageCatalog
                ? [
                    {
                      id: "edit",
                      label: "Edit",
                      onSelect: () => openEdit(row),
                    },
                    {
                      id: "duplicate",
                      label: "Duplicate",
                      onSelect: () => handleDuplicate(row),
                    },
                    row.archived
                      ? {
                          id: "restore",
                          label: "Restore",
                          onSelect: () => requestRestore(row),
                        }
                      : {
                          id: "archive",
                          label: "Archive",
                          onSelect: () => requestArchive(row),
                          tone: "danger" as const,
                        },
                  ]
                : []),
            ]}
          />
        </RowActionsMenuSlot>
      ),
    },
  ];

  const showActiveZeroEmpty =
    seeded &&
    filters.archive === "active" &&
    visibleItems.length === 0 &&
    !hasActiveListFilters(filters);

  const showArchivedZeroEmpty =
    seeded &&
    filters.archive === "archived" &&
    visibleItems.length === 0 &&
    !hasActiveListFilters(filters);

  const showFilteredEmpty =
    seeded &&
    visibleItems.length === 0 &&
    !showActiveZeroEmpty &&
    !showArchivedZeroEmpty;

  const panelOpen = panelMode !== "closed";
  const panelTitle =
    panelMode === "create"
      ? "Create Service"
      : panelMode === "edit"
        ? "Edit Service"
        : selectedItem
          ? selectedItem.name
          : "Catalog Item";

  const panelDescription =
    panelMode === "create"
      ? "Add a reusable catalog template for quoting."
      : panelMode === "edit" && selectedItem
        ? selectedItem.id
        : selectedItem
          ? `${selectedItem.id} · ${catalogRecordStatus(selectedItem)}`
          : undefined;

  return (
    <PageContainer className="gap-6" aria-busy={seeded ? undefined : true}>
      <PageHeader
        title="Service Catalog"
        description="Reusable quote templates · not inventory."
        actions={
          canManageCatalog ? (
            <Button type="button" onClick={openCreate}>
              <IconPlus className="size-4" />
              Create Service
            </Button>
          ) : null
        }
      />

      <FilterBar>
        <div className="w-full sm:max-w-sm">
          <SearchInput
            label="Search catalog"
            placeholder="Search name, description, category, unit…"
            value={filters.query}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            leadingIcon={<IconSearch className="size-4" />}
          />
        </div>
        <ActiveArchivedToggle
          value={filters.archive}
          onChange={(archive) => setFilters((prev) => ({ ...prev, archive }))}
        />
        <Select
          aria-label="Filter by category"
          className="w-full sm:w-44"
          value={filters.category}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              category: event.target.value as CatalogFilters["category"],
            }))
          }
        >
          <option value="all">All Categories</option>
          {LINE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort catalog"
          className="w-full sm:w-52"
          value={filters.sort}
          onChange={(event) => {
            const sort = event.target.value as CatalogSortOption;
            setFilters((prev) => ({
              ...prev,
              sort,
              sortDir: sort === "updated" ? "desc" : "asc",
            }));
          }}
        >
          <option value="name">Sort: Service Name</option>
          <option value="category">Sort: Category</option>
          <option value="price">Sort: Default Price</option>
          <option value="status">Sort: Status</option>
          <option value="updated">Sort: Last Updated</option>
        </Select>
        {hasActiveListFilters(filters) ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </FilterBar>

      <div className="hidden md:block">
        {showActiveZeroEmpty ? (
          <EmptyState
            title="No active catalog items."
            description="Create reusable services, materials, and labor templates for the Quote Builder."
            actionLabel={canManageCatalog ? "Create Service" : undefined}
            onAction={canManageCatalog ? openCreate : undefined}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived catalog items."
            description="Archived items stay out of the Quote Builder picker until restored."
            actionLabel="View Active Items"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No catalog items match these filters."
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel={canManageCatalog ? "Create Service" : undefined}
            onSecondary={canManageCatalog ? openCreate : undefined}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={visibleItems}
            getRowId={(row) => row.id}
            sortColumn={filters.sort}
            sortDirection={filters.sortDir}
            onSort={handleSort}
            onRowClick={openSummary}
          />
        )}
      </div>

      <div className="space-y-3 md:hidden">
        {showActiveZeroEmpty ? (
          <EmptyState
            title="No active catalog items."
            description="Create reusable services, materials, and labor templates for the Quote Builder."
            actionLabel={canManageCatalog ? "Create Service" : undefined}
            onAction={canManageCatalog ? openCreate : undefined}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived catalog items."
            description="Archived items stay out of the Quote Builder picker until restored."
            actionLabel="View Active Items"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No catalog items match these filters."
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel={canManageCatalog ? "Create Service" : undefined}
            onSecondary={canManageCatalog ? openCreate : undefined}
          />
        ) : (
          visibleItems.map((item) => {
            const status = catalogRecordStatus(item);
            return (
              <div
                key={item.id}
                className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => openSummary(item)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {item.category}
                      {item.unit.trim() ? ` · ${item.unit}` : ""}
                    </p>
                    <p className="mt-2 text-sm font-medium tabular-nums text-text-primary">
                      {formatCurrency(item.unitPrice)}
                    </p>
                    <p className="mt-1 text-xs text-text-secondary">
                      Updated {formatShortDate(item.updatedAt)}
                    </p>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusBadge
                      label={status}
                      tone={status === "Active" ? "active" : "archived"}
                    />
                    <RowActionsMenu
                      label={`Actions for ${item.name}`}
                      items={[
                        {
                          id: "open",
                          label: "Open",
                          onSelect: () => openSummary(item),
                        },
                        ...(canManageCatalog
                          ? [
                              {
                                id: "edit",
                                label: "Edit",
                                onSelect: () => openEdit(item),
                              },
                              {
                                id: "duplicate",
                                label: "Duplicate",
                                onSelect: () => handleDuplicate(item),
                              },
                              item.archived
                                ? {
                                    id: "restore",
                                    label: "Restore",
                                    onSelect: () => requestRestore(item),
                                  }
                                : {
                                    id: "archive",
                                    label: "Archive",
                                    onSelect: () => requestArchive(item),
                                    tone: "danger" as const,
                                  },
                            ]
                          : []),
                      ]}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <SlideOver
        open={panelOpen}
        title={panelTitle}
        description={panelDescription}
        onClose={requestClosePanel}
        wide
        suspendInteractions={confirm !== null || isLeavePromptOpen}
        focusKey={panelMode}
        footer={
          panelMode === "create" || panelMode === "edit" ? (
            <CatalogFormFooter
              formId={formId}
              onCancel={requestClosePanel}
              submitLabel={panelMode === "create" ? "Create Service" : "Save Changes"}
            />
          ) : null
        }
      >
        {panelMode === "summary" && selectedItem ? (
          <CatalogSummary
            item={
              items.find((item) => item.id === selectedItem.id) ?? selectedItem
            }
            canManage={canManageCatalog}
            onEdit={() => {
              const current =
                items.find((item) => item.id === selectedItem.id) ??
                selectedItem;
              openEdit(current);
            }}
            onDuplicate={() => {
              const current =
                items.find((item) => item.id === selectedItem.id) ??
                selectedItem;
              handleDuplicate(current);
            }}
            onArchive={() =>
              requestArchive(
                items.find((item) => item.id === selectedItem.id) ??
                  selectedItem,
              )
            }
            onRestore={() =>
              requestRestore(
                items.find((item) => item.id === selectedItem.id) ??
                  selectedItem,
              )
            }
          />
        ) : null}

        {(panelMode === "create" || panelMode === "edit") && (
          <CatalogForm
            formId={formId}
            values={formValues}
            errors={errors}
            onChange={setFormValues}
            onSubmit={saveItem}
          />
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirm?.type === "archive"}
        title="Archive this catalog item?"
        description="Archived items will no longer appear in the Quote Builder catalog picker."
        confirmLabel="Archive"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === "archive") {
            handleArchive(confirm.item);
          }
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "restore"}
        title="Restore this catalog item?"
        description="Restored items become Active and appear again in the Quote Builder catalog picker."
        confirmLabel="Restore"
        cancelLabel="Cancel"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === "restore") {
            handleRestore(confirm.item);
          }
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "discard"}
        title="Discard unsaved changes?"
        description="You have unsaved edits. Discard them and continue?"
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type !== "discard") return;
          const pending = confirm.pending;
          setConfirm(null);
          applyPendingNavigation(pending);
        }}
      />

      {leaveDialog}
    </PageContainer>
  );
}
