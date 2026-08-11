"use client";

import { CustomerForm, CustomerFormFooter } from "@/components/customers/customer-form";
import { CustomerSummary } from "@/components/customers/customer-summary";
import { IconPlus, IconSearch, IconUsersEmpty } from "@/components/icons";
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
  type RowActionItem,
} from "@/components/ui/row-actions-menu";
import { SearchInput } from "@/components/ui/search-input";
import { SlideOver } from "@/components/ui/slide-over";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  customerToFormValues,
  emptyCustomerForm,
} from "@/lib/customers/demo-data";
import { useCustomerSession } from "@/components/session/customer-session-provider";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { useUnsavedNavigationGuard } from "@/lib/navigation/use-unsaved-navigation-guard";
import {
  DEFAULT_CUSTOMER_FILTERS,
  filterCustomers,
  getDistinctCities,
  getDistinctCompanies,
  hasActiveListFilters,
  hasRestrictiveListFilters,
  validateCustomerForm,
  type CustomerFieldErrors,
  type CustomerFilters,
  type CustomerSortOption,
} from "@/lib/customers/filters";
import { formatShortDate } from "@/lib/format";
import {
  customerCityState,
  customerDisplayName,
  customerRecordStatus,
  type Customer,
  type CustomerFormValues,
} from "@/types/customer";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type PanelMode = "closed" | "summary" | "create" | "edit";

type ConfirmState =
  | { type: "archive"; customer: Customer }
  | { type: "restore"; customer: Customer }
  | { type: "discard" }
  | null;

const SORT_COLUMN_MAP: Record<string, CustomerSortOption> = {
  name: "name",
  company: "company",
  city: "city",
  quotes: "quotes",
  lastQuote: "lastQuote",
};

function formsEqual(a: CustomerFormValues, b: CustomerFormValues): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.phone === b.phone &&
    a.email === b.email &&
    a.companyName === b.companyName &&
    a.street === b.street &&
    a.city === b.city &&
    a.state === b.state &&
    a.zip === b.zip &&
    a.internalNotes === b.internalNotes
  );
}

export function CustomersView() {
  const {
    ready,
    customers,
    createCustomer,
    updateCustomer,
    archiveCustomer,
    restoreCustomer,
  } = useCustomerSession();
  const { capabilities } = useDemoAuthSession();
  const searchParams = useSearchParams();
  const router = useRouter();

  const seeded = ready;
  const [filters, setFilters] = useState<CustomerFilters>(DEFAULT_CUSTOMER_FILTERS);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomerFormValues>(emptyCustomerForm());
  const [baselineForm, setBaselineForm] = useState<CustomerFormValues>(emptyCustomerForm());
  const [errors, setErrors] = useState<CustomerFieldErrors>({});
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [createDeepLinkHandled, setCreateDeepLinkHandled] = useState(false);
  const [shouldClearCreateParam, setShouldClearCreateParam] = useState(false);

  if (
    seeded &&
    !createDeepLinkHandled &&
    searchParams.get("create") === "1"
  ) {
    setCreateDeepLinkHandled(true);
    setShouldClearCreateParam(true);
    setSelectedId(null);
    setFormValues(emptyCustomerForm());
    setBaselineForm(emptyCustomerForm());
    setErrors({});
    setPanelMode("create");
  }

  useEffect(() => {
    if (!shouldClearCreateParam) return;
    router.replace("/customers", { scroll: false });
  }, [shouldClearCreateParam, router]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedId) ?? null,
    [customers, selectedId],
  );

  const companies = useMemo(
    () => getDistinctCompanies(customers),
    [customers],
  );
  const cities = useMemo(() => getDistinctCities(customers), [customers]);

  const visibleCustomers = useMemo(
    () => filterCustomers(customers, filters),
    [customers, filters],
  );

  const dirty = !formsEqual(formValues, baselineForm);
  const formId = "customer-form";
  const formIsDirty =
    (panelMode === "create" || panelMode === "edit") && dirty;
  const { leaveDialog, isLeavePromptOpen } = useUnsavedNavigationGuard({
    isDirty: formIsDirty,
  });

  function openCreate() {
    const blank = emptyCustomerForm();
    setSelectedId(null);
    setFormValues(blank);
    setBaselineForm(blank);
    setErrors({});
    setPanelMode("create");
  }

  function openSummary(customer: Customer) {
    setSelectedId(customer.id);
    setErrors({});
    setPanelMode("summary");
  }

  function openEdit(customer: Customer) {
    const values = customerToFormValues(customer);
    setSelectedId(customer.id);
    setFormValues(values);
    setBaselineForm(values);
    setErrors({});
    setPanelMode("edit");
  }

  function requestClosePanel() {
    if ((panelMode === "create" || panelMode === "edit") && dirty) {
      setConfirm({ type: "discard" });
      return;
    }
    closePanel();
  }

  function closePanel() {
    setPanelMode("closed");
    setSelectedId(null);
    setErrors({});
    setFormValues(emptyCustomerForm());
    setBaselineForm(emptyCustomerForm());
  }

  function saveCustomer() {
    const nextErrors = validateCustomerForm(formValues);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0];
      document.getElementById(firstKey)?.focus();
      return;
    }

    const trimmed: CustomerFormValues = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      phone: formValues.phone.trim(),
      email: formValues.email.trim(),
      companyName: formValues.companyName.trim(),
      street: formValues.street.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim().toUpperCase(),
      zip: formValues.zip.trim(),
      internalNotes: formValues.internalNotes.trim(),
    };

    if (panelMode === "create") {
      const created = createCustomer(trimmed);
      setSelectedId(created.id);
      setPanelMode("summary");
      setBaselineForm(customerToFormValues(created));
      setFormValues(customerToFormValues(created));
      return;
    }

    if (panelMode === "edit" && selectedId) {
      const updated = updateCustomer(selectedId, trimmed);
      if (updated) {
        setPanelMode("summary");
        setBaselineForm(customerToFormValues(updated));
        setFormValues(customerToFormValues(updated));
      }
    }
  }

  function handleArchiveCustomer(customer: Customer) {
    archiveCustomer(customer.id);
    if (selectedId === customer.id) {
      setPanelMode("summary");
    }
  }

  function handleRestoreCustomer(customer: Customer) {
    restoreCustomer(customer.id);
    if (selectedId === customer.id) {
      setPanelMode("summary");
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
      return { ...prev, sort, sortDir: "asc" };
    });
  }

  function clearFilters() {
    setFilters((prev) => ({
      ...DEFAULT_CUSTOMER_FILTERS,
      archive: prev.archive,
    }));
  }

  function customerRowActions(customer: Customer): RowActionItem[] {
    const items: RowActionItem[] = [
      {
        id: "open",
        label: "Open",
        onSelect: () => openSummary(customer),
      },
      {
        id: "edit",
        label: "Edit",
        onSelect: () => openEdit(customer),
      },
      {
        id: "quote",
        label: "New Quote",
        disabled: customer.archived,
        onSelect: () => {
          router.push(`/quotes/new?customer=${customer.id}`);
        },
      },
    ];
    if (customer.archived) {
      if (capabilities.canRestore) {
        items.push({
          id: "restore",
          label: "Restore",
          onSelect: () => setConfirm({ type: "restore", customer }),
        });
      }
    } else {
      items.push({
        id: "archive",
        label: "Archive",
        tone: "danger",
        onSelect: () => setConfirm({ type: "archive", customer }),
      });
    }
    return items;
  }

  const columns: DataTableColumn<Customer>[] = [
    {
      id: "name",
      header: "Customer Name",
      sortable: true,
      cell: (row) => (
        <div className="min-w-[10rem]">
          <p className="font-medium text-text-primary">
            {customerDisplayName(row)}
          </p>
          <p className="text-xs text-text-secondary font-mono tabular-nums">
            {row.id}
          </p>
        </div>
      ),
    },
    {
      id: "company",
      header: "Company",
      sortable: true,
      cell: (row) => (
        <span className="text-text-primary">{row.companyName || "—"}</span>
      ),
    },
    {
      id: "phone",
      header: "Phone",
      cell: (row) => (
        <span className="tabular-nums text-text-primary">{row.phone}</span>
      ),
    },
    {
      id: "email",
      header: "Email",
      className: "max-w-[12rem]",
      cell: (row) => (
        <span className="block truncate text-text-primary" title={row.email}>
          {row.email || "—"}
        </span>
      ),
    },
    {
      id: "city",
      header: "City/State",
      sortable: true,
      cell: (row) => (
        <span className="text-text-primary">{customerCityState(row)}</span>
      ),
    },
    {
      id: "quotes",
      header: "Total Quotes",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums font-medium text-text-primary">
          {row.totalQuotes}
        </span>
      ),
    },
    {
      id: "lastQuote",
      header: "Last Quote Date",
      sortable: true,
      cell: (row) => (
        <span className="tabular-nums text-text-primary">
          {row.lastQuoteDate ? formatShortDate(row.lastQuoteDate) : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => {
        const status = customerRecordStatus(row);
        return (
          <StatusBadge
            label={status}
            tone={status === "Active" ? "active" : "archived"}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <RowActionsMenuSlot>
          <RowActionsMenu
            label={`Actions for ${customerDisplayName(row)}`}
            items={customerRowActions(row)}
          />
        </RowActionsMenuSlot>
      ),
    },
  ];

  const showActiveZeroEmpty =
    seeded &&
    filters.archive === "active" &&
    customers.every((customer) => customer.archived) &&
    !hasRestrictiveListFilters(filters);

  const showArchivedZeroEmpty =
    seeded &&
    filters.archive === "archived" &&
    customers.every((customer) => !customer.archived) &&
    !hasRestrictiveListFilters(filters);

  const showFilteredEmpty =
    seeded &&
    visibleCustomers.length === 0 &&
    !showActiveZeroEmpty &&
    !showArchivedZeroEmpty;

  const panelOpen = panelMode !== "closed";
  const panelTitle =
    panelMode === "create"
      ? "New Customer"
      : panelMode === "edit"
        ? "Edit Customer"
        : selectedCustomer
          ? customerDisplayName(selectedCustomer)
          : "Customer";

  const panelDescription =
    panelMode === "create"
      ? "Add a reusable customer record for quoting."
      : panelMode === "edit" && selectedCustomer
        ? `${selectedCustomer.id}`
        : selectedCustomer
          ? `${selectedCustomer.id} · ${customerRecordStatus(selectedCustomer)}`
          : undefined;

  return (
    <PageContainer className="gap-6" aria-busy={seeded ? undefined : true}>
      <PageHeader
        title="Customers"
        description="Find and manage reusable customer records for quoting."
        actions={
          <Button type="button" onClick={openCreate}>
            <IconPlus className="size-4" />
            New Customer
          </Button>
        }
      />

      <FilterBar>
        <div className="w-full sm:max-w-sm">
          <SearchInput
            label="Search customers"
            placeholder="Search name, company, phone, email, street…"
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
          aria-label="Filter by company"
          className="w-full sm:w-44"
          value={filters.company}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, company: event.target.value }))
          }
        >
          <option value="">All companies</option>
          {companies.map((company) => (
            <option key={company} value={company}>
              {company}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by city"
          className="w-full sm:w-40"
          value={filters.city}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, city: event.target.value }))
          }
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </Select>
        <Select
          aria-label="Sort customers"
          className="w-full sm:w-52"
          value={filters.sort}
          onChange={(event) => {
            const value = event.target.value as CustomerSortOption;
            const descending =
              value === "recentlyAdded" ||
              value === "recentlyUpdated" ||
              value === "quotes" ||
              value === "lastQuote";
            setFilters((prev) => ({
              ...prev,
              sort: value,
              sortDir: descending ? "desc" : "asc",
            }));
          }}
        >
          <option value="name">Sort: Name</option>
          <option value="company">Sort: Company</option>
          <option value="city">Sort: City/State</option>
          <option value="quotes">Sort: Total Quotes</option>
          <option value="lastQuote">Sort: Last Quote Date</option>
          <option value="recentlyAdded">Recently Added</option>
          <option value="recentlyUpdated">Recently Updated</option>
        </Select>
        {hasActiveListFilters(filters) ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
            Clear filters
          </Button>
        ) : null}
      </FilterBar>

      {/* Desktop / tablet table */}
      <div className="hidden md:block">
        {showActiveZeroEmpty ? (
          <EmptyState
            icon={<IconUsersEmpty />}
            title="Create your first customer"
            description="Save reusable contact and service-address details so quotes start faster."
            actionLabel="+ New Customer"
            onAction={openCreate}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived customers"
            description="Archived customers will appear here. Active customers stay in the Active list."
            actionLabel="View Active customers"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No customers match these filters"
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel="New Customer"
            onSecondary={openCreate}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={visibleCustomers}
            getRowId={(row) => row.id}
            sortColumn={
              filters.sort === "recentlyAdded" ||
              filters.sort === "recentlyUpdated"
                ? undefined
                : filters.sort
            }
            sortDirection={filters.sortDir}
            onSort={handleSort}
            onRowClick={openSummary}
          />
        )}
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {showActiveZeroEmpty ? (
          <EmptyState
            icon={<IconUsersEmpty />}
            title="Create your first customer"
            description="Save reusable contact and service-address details so quotes start faster."
            actionLabel="+ New Customer"
            onAction={openCreate}
          />
        ) : showArchivedZeroEmpty ? (
          <EmptyState
            title="No archived customers"
            description="Archived customers will appear here. Active customers stay in the Active list."
            actionLabel="View Active customers"
            onAction={() =>
              setFilters((prev) => ({ ...prev, archive: "active" }))
            }
          />
        ) : showFilteredEmpty ? (
          <EmptyState
            title="No customers match these filters"
            description="Try adjusting search or filters to see more results."
            actionLabel="Clear filters"
            onAction={clearFilters}
            secondaryLabel="New Customer"
            onSecondary={openCreate}
          />
        ) : (
          visibleCustomers.map((customer) => {
            const status = customerRecordStatus(customer);
            return (
              <button
                key={customer.id}
                type="button"
                onClick={() => openSummary(customer)}
                className="w-full rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 text-left shadow-sm transition-colors duration-150 hover:bg-bg-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-text-primary">
                      {customerDisplayName(customer)}
                    </p>
                    <p className="mt-0.5 text-sm text-text-secondary">
                      {customer.companyName || customerCityState(customer)}
                    </p>
                  </div>
                  <StatusBadge
                    label={status}
                    tone={status === "Active" ? "active" : "archived"}
                  />
                </div>
                <p className="mt-3 text-sm text-text-secondary">
                  {customer.phone}
                  {customer.email ? ` · ${customer.email}` : ""}
                </p>
                <p className="mt-1 text-sm text-text-secondary tabular-nums">
                  {customer.totalQuotes} quotes
                  {customer.lastQuoteDate
                    ? ` · Last ${formatShortDate(customer.lastQuoteDate)}`
                    : ""}
                </p>
              </button>
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
            <CustomerFormFooter formId={formId} onCancel={requestClosePanel} />
          ) : selectedCustomer && !selectedCustomer.archived ? (
            <div className="flex flex-wrap justify-end gap-2">
              <Link
                href={`/quotes?customer=${selectedCustomer.id}`}
                className={buttonClassName({ variant: "secondary" })}
              >
                View Quotes
              </Link>
              <Link
                href={`/quotes/new?customer=${selectedCustomer.id}`}
                className={buttonClassName({ variant: "primary" })}
              >
                New Quote
              </Link>
            </div>
          ) : null
        }
      >
        {panelMode === "summary" && selectedCustomer ? (
          <CustomerSummary
            customer={
              customers.find((item) => item.id === selectedCustomer.id) ??
              selectedCustomer
            }
            onEdit={() => {
              const current =
                customers.find((item) => item.id === selectedCustomer.id) ??
                selectedCustomer;
              openEdit(current);
            }}
            onArchive={() =>
              setConfirm({
                type: "archive",
                customer:
                  customers.find((item) => item.id === selectedCustomer.id) ??
                  selectedCustomer,
              })
            }
            onRestore={() =>
              setConfirm({
                type: "restore",
                customer:
                  customers.find((item) => item.id === selectedCustomer.id) ??
                  selectedCustomer,
              })
            }
            canRestore={capabilities.canRestore}
          />
        ) : null}

        {(panelMode === "create" || panelMode === "edit") && (
          <CustomerForm
            formId={formId}
            values={formValues}
            errors={errors}
            onChange={(values) => {
              setFormValues(values);
              if (Object.keys(errors).length > 0) {
                setErrors(validateCustomerForm(values));
              }
            }}
            onSubmit={saveCustomer}
          />
        )}
      </SlideOver>

      <ConfirmDialog
        open={confirm?.type === "archive"}
        title="Archive this customer?"
        description="Archived customers cannot receive new quotes until restored."
        confirmLabel="Archive Customer"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === "archive") {
            handleArchiveCustomer(confirm.customer);
          }
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "restore"}
        title="Restore this customer?"
        description="This customer will appear in Active lists and can receive new quotes again."
        confirmLabel="Restore Customer"
        tone="primary"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm?.type === "restore") {
            handleRestoreCustomer(confirm.customer);
          }
          setConfirm(null);
        }}
      />

      <ConfirmDialog
        open={confirm?.type === "discard"}
        title="Discard unsaved changes?"
        description="Your edits will be lost if you leave without saving."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          closePanel();
        }}
      />

      {leaveDialog}
    </PageContainer>
  );
}
