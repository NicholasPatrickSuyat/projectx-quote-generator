"use client";

import { IconSearch, IconUsersEmpty } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { Input, Select } from "@/components/ui/input";
import {
  RowActionsMenu,
  RowActionsMenuSlot,
  type RowActionItem,
} from "@/components/ui/row-actions-menu";
import { SearchInput } from "@/components/ui/search-input";
import { SlideOver } from "@/components/ui/slide-over";
import { StatusBadge } from "@/components/ui/status-badge";
import { useDemoAuthSession } from "@/components/session/demo-auth-session-provider";
import { useUnsavedNavigationGuard } from "@/lib/navigation/use-unsaved-navigation-guard";
import { emptyUserForm, userToFormValues } from "@/lib/users/demo-data";
import {
  DEFAULT_USER_FILTERS,
  filterUsers,
  hasActiveUserFilters,
  type UserFilters,
  type UserSortOption,
} from "@/lib/users/filters";
import type { UserFieldErrors } from "@/lib/users/validation";
import { formatShortDate } from "@/lib/format";
import {
  USER_ROLES,
  userInitials,
  type User,
  type UserFormValues,
} from "@/types/user";
import { useMemo, useState } from "react";

type PanelMode = "closed" | "create" | "edit";

type ConfirmState =
  | { type: "deactivate"; user: User }
  | { type: "activate"; user: User }
  | { type: "discard" }
  | null;

function formsEqual(a: UserFormValues, b: UserFormValues): boolean {
  return (
    a.fullName === b.fullName &&
    a.email === b.email &&
    a.role === b.role &&
    a.active === b.active &&
    a.demoPassword === b.demoPassword
  );
}

export function UsersView() {
  const {
    ready,
    users,
    currentUser,
    createUserAccount,
    updateUserAccount,
    setUserActiveState,
  } = useDemoAuthSession();

  const [filters, setFilters] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyUserForm());
  const [baselineForm, setBaselineForm] = useState<UserFormValues>(emptyUserForm());
  const [errors, setErrors] = useState<UserFieldErrors>({});
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const selectedUser = selectedId
    ? users.find((user) => user.id === selectedId)
    : undefined;

  const visibleUsers = useMemo(
    () => filterUsers(users, filters),
    [users, filters],
  );

  const dirty = !formsEqual(formValues, baselineForm);
  const panelOpen = panelMode !== "closed";
  const { leaveDialog, isLeavePromptOpen } = useUnsavedNavigationGuard({
    isDirty: (panelMode === "create" || panelMode === "edit") && dirty,
  });

  function openCreate() {
    const blank = emptyUserForm();
    setSelectedId(null);
    setFormValues(blank);
    setBaselineForm(blank);
    setErrors({});
    setActionError(null);
    setPanelMode("create");
  }

  function openEdit(user: User) {
    const values = userToFormValues(user);
    setSelectedId(user.id);
    setFormValues(values);
    setBaselineForm(values);
    setErrors({});
    setActionError(null);
    setPanelMode("edit");
  }

  function requestClosePanel() {
    if (dirty) {
      setConfirm({ type: "discard" });
      return;
    }
    setPanelMode("closed");
    setSelectedId(null);
    setErrors({});
    setActionError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setActionError(null);
    if (panelMode === "create") {
      const result = createUserAccount(formValues);
      if (result.errors && Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        return;
      }
      setPanelMode("closed");
      setFormValues(emptyUserForm());
      setBaselineForm(emptyUserForm());
      setErrors({});
      return;
    }
    if (panelMode === "edit" && selectedId) {
      const result = updateUserAccount(selectedId, formValues);
      if (result.errors && Object.keys(result.errors).length > 0) {
        setErrors(result.errors);
        return;
      }
      setPanelMode("closed");
      setSelectedId(null);
      setErrors({});
    }
  }

  function userRowActions(user: User): RowActionItem[] {
    const items: RowActionItem[] = [
      {
        id: "edit",
        label: "Edit",
        onSelect: () => openEdit(user),
      },
    ];
    if (user.active) {
      items.push({
        id: "deactivate",
        label: "Deactivate",
        tone: "danger",
        onSelect: () => setConfirm({ type: "deactivate", user }),
      });
    } else {
      items.push({
        id: "activate",
        label: "Activate",
        onSelect: () => setConfirm({ type: "activate", user }),
      });
    }
    return items;
  }

  const columns: DataTableColumn<User>[] = [
    {
      id: "name",
      header: "Name",
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-semibold text-primary">
            {userInitials(row.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-text-primary">
              {row.fullName}
              {currentUser?.id === row.id ? (
                <span className="ml-1.5 text-xs font-normal text-text-muted">
                  (you)
                </span>
              ) : null}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "email",
      header: "Email",
      sortable: true,
      cell: (row) => (
        <span className="block max-w-[16rem] truncate text-text-secondary">
          {row.email}
        </span>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortable: true,
      cell: (row) => (
        <span className="text-sm text-text-primary">{row.role}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      sortable: true,
      cell: (row) => (
        <StatusBadge
          label={row.active ? "Active" : "Inactive"}
          tone={row.active ? "active" : "archived"}
        />
      ),
    },
    {
      id: "updated",
      header: "Updated",
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
      headerClassName: "text-right",
      className: "text-right",
      cell: (row) => (
        <RowActionsMenuSlot>
          <RowActionsMenu
            label={`Actions for ${row.fullName}`}
            items={userRowActions(row)}
          />
        </RowActionsMenuSlot>
      ),
    },
  ];

  function onSortChange(columnId: string) {
    const sortMap: Record<string, UserSortOption> = {
      name: "name",
      email: "email",
      role: "role",
      status: "status",
      updated: "updated",
    };
    const nextSort = sortMap[columnId];
    if (!nextSort) return;
    setFilters((prev) => ({
      ...prev,
      sort: nextSort,
      sortDir:
        prev.sort === nextSort && prev.sortDir === "asc" ? "desc" : "asc",
    }));
  }

  const showEmpty =
    ready && visibleUsers.length === 0 && !hasActiveUserFilters(filters);
  const showFilteredEmpty =
    ready && visibleUsers.length === 0 && hasActiveUserFilters(filters);

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage demo user accounts and roles. Demo authentication only."
        actions={
          <Button type="button" variant="primary" onClick={openCreate}>
            + New User
          </Button>
        }
      />

      <p className="rounded-[var(--radius-md)] border border-border-default bg-bg-muted/50 px-3 py-2 text-xs text-text-secondary">
        Demo-only credentials are stored in this browser session. This is not
        production security.
      </p>

      {actionError ? (
        <p className="text-sm text-danger" role="alert">
          {actionError}
        </p>
      ) : null}

      <FilterBar>
        <div className="w-full sm:max-w-sm">
          <SearchInput
            label="Search users"
            value={filters.query}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, query: event.target.value }))
            }
            placeholder="Search name or email…"
            leadingIcon={<IconSearch className="size-4" />}
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              status: event.target.value as UserFilters["status"],
            }))
          }
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
        <Select
          aria-label="Filter by role"
          value={filters.role}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              role: event.target.value as UserFilters["role"],
            }))
          }
        >
          <option value="all">All roles</option>
          {USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
      </FilterBar>

      {!ready ? (
        <div className="h-40 animate-pulse rounded-[var(--radius-md)] bg-bg-muted" />
      ) : showEmpty ? (
        <EmptyState
          icon={<IconUsersEmpty />}
          title="No users yet"
          description="Create an Admin or Office Staff account for demos."
          actionLabel="New User"
          onAction={openCreate}
        />
      ) : showFilteredEmpty ? (
        <EmptyState
          icon={<IconUsersEmpty />}
          title="No matching users"
          description="Try clearing search or filters."
          secondaryLabel="Clear filters"
          onSecondary={() => setFilters(DEFAULT_USER_FILTERS)}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              rows={visibleUsers}
              getRowId={(row) => row.id}
              sortColumn={filters.sort}
              sortDirection={filters.sortDir}
              onSort={onSortChange}
              onRowClick={(row) => openEdit(row)}
            />
          </div>
          <div className="space-y-3 md:hidden">
            {visibleUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="min-w-0 text-left"
                    onClick={() => openEdit(user)}
                  >
                    <p className="font-semibold text-text-primary">
                      {user.fullName}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-text-secondary">
                      {user.email}
                    </p>
                  </button>
                  <RowActionsMenu
                    label={`Actions for ${user.fullName}`}
                    items={userRowActions(user)}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={user.active ? "Active" : "Inactive"}
                    tone={user.active ? "active" : "archived"}
                  />
                  <span className="text-xs text-text-muted">{user.role}</span>
                  <span className="text-xs text-text-muted">
                    Updated {formatShortDate(user.updatedAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </>
      )}

      <SlideOver
        open={panelOpen}
        title={panelMode === "create" ? "New User" : "Edit User"}
        description={
          panelMode === "create"
            ? "Create a demo account. Credentials are session-only."
            : selectedUser
              ? `${selectedUser.email} · Created ${formatShortDate(selectedUser.createdAt)}`
              : undefined
        }
        onClose={requestClosePanel}
        suspendInteractions={confirm !== null || isLeavePromptOpen}
        focusKey={panelMode}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={requestClosePanel}>
              Cancel
            </Button>
            <Button type="submit" form="user-form" variant="primary">
              {panelMode === "create" ? "Create User" : "Save Changes"}
            </Button>
          </div>
        }
      >
        <form id="user-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
          <FormField
            id="user-full-name"
            label="Full Name"
            required
            error={errors.fullName}
          >
            <Input
              {...fieldControlProps("user-full-name", errors.fullName)}
              value={formValues.fullName}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  fullName: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField
            id="user-email"
            label="Email"
            required
            error={errors.email}
          >
            <Input
              {...fieldControlProps("user-email", errors.email)}
              type="email"
              autoComplete="off"
              value={formValues.email}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  email: event.target.value,
                }))
              }
            />
          </FormField>
          <FormField id="user-role" label="Role" required error={errors.role}>
            <Select
              {...fieldControlProps("user-role", errors.role)}
              value={formValues.role}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  role: event.target.value as UserFormValues["role"],
                }))
              }
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField id="user-active" label="Status">
            <Select
              {...fieldControlProps("user-active")}
              value={formValues.active ? "active" : "inactive"}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  active: event.target.value === "active",
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </FormField>
          <FormField
            id="user-demo-password"
            label={
              panelMode === "create"
                ? "Demo password"
                : "Demo password (leave blank to keep)"
            }
            required={panelMode === "create"}
            error={errors.demoPassword}
          >
            <Input
              {...fieldControlProps("user-demo-password", errors.demoPassword)}
              type="password"
              autoComplete="new-password"
              value={formValues.demoPassword}
              onChange={(event) =>
                setFormValues((prev) => ({
                  ...prev,
                  demoPassword: event.target.value,
                }))
              }
            />
          </FormField>
          <p className="text-xs text-text-muted">
            Profile picture upload is deferred. The data model already supports
            it for a later milestone.
          </p>
          {errors.form || actionError ? (
            <p className="text-sm text-danger" role="alert">
              {errors.form ?? actionError}
            </p>
          ) : null}
        </form>
      </SlideOver>

      <ConfirmDialog
        open={confirm?.type === "discard"}
        title="Discard changes?"
        description="Unsaved user edits will be lost."
        confirmLabel="Discard"
        tone="danger"
        onCancel={() => {
          setConfirm(null);
          setActionError(null);
        }}
        onConfirm={() => {
          setConfirm(null);
          setPanelMode("closed");
          setSelectedId(null);
          setErrors({});
          setActionError(null);
          setFormValues(emptyUserForm());
          setBaselineForm(emptyUserForm());
        }}
      />
      <ConfirmDialog
        open={confirm?.type === "deactivate"}
        title="Deactivate user?"
        description="Inactive users cannot sign in. Historical quotes keep their Prepared By name."
        confirmLabel="Deactivate"
        tone="danger"
        onCancel={() => {
          setConfirm(null);
          setActionError(null);
        }}
        onConfirm={() => {
          if (confirm?.type !== "deactivate") return;
          setActionError(null);
          const message = setUserActiveState(confirm.user.id, false);
          setConfirm(null);
          if (message) {
            setActionError(message);
          }
        }}
      />
      <ConfirmDialog
        open={confirm?.type === "activate"}
        title="Activate user?"
        description="This user will be able to sign in again with their demo credentials."
        confirmLabel="Activate"
        onCancel={() => {
          setConfirm(null);
          setActionError(null);
        }}
        onConfirm={() => {
          if (confirm?.type !== "activate") return;
          setActionError(null);
          const message = setUserActiveState(confirm.user.id, true);
          setConfirm(null);
          if (message) {
            setActionError(message);
          }
        }}
      />

      {leaveDialog}
    </PageContainer>
  );
}
