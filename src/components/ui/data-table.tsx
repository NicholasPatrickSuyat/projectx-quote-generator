"use client";

import { IconChevronDown, IconChevronUp } from "@/components/icons";
import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type DataTableColumn<T> = {
  id: string;
  header: string;
  sortable?: boolean;
  className?: string;
  headerClassName?: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  sortColumn?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (columnId: string) => void;
  onRowClick?: (row: T) => void;
  emptyState?: ReactNode;
  className?: string;
};

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  sortColumn,
  sortDirection = "asc",
  onSort,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-md)] border border-border-default bg-bg-surface shadow-sm",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-bg-muted/95 backdrop-blur-sm">
            <tr className="border-b border-border-default">
              {columns.map((column) => {
                const sorted = sortColumn === column.id;
                return (
                  <th
                    key={column.id}
                    scope="col"
                    aria-sort={
                      column.sortable
                        ? sorted
                          ? sortDirection === "asc"
                            ? "ascending"
                            : "descending"
                          : "none"
                        : undefined
                    }
                    className={cn(
                      "px-4 py-3 text-xs font-semibold tracking-wide text-text-secondary uppercase",
                      column.headerClassName,
                      column.className,
                    )}
                  >
                    {column.sortable && onSort ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 rounded-sm hover:text-text-primary"
                        onClick={() => onSort(column.id)}
                      >
                        {column.header}
                        {sorted ? (
                          sortDirection === "asc" ? (
                            <IconChevronUp className="size-3.5" />
                          ) : (
                            <IconChevronDown className="size-3.5" />
                          )
                        ) : (
                          <span className="text-text-muted" aria-hidden>
                            ↕
                          </span>
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                className={cn(
                  "border-b border-border-default last:border-b-0",
                  onRowClick &&
                    "cursor-pointer transition-colors duration-150 hover:bg-bg-muted",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "px-4 py-3 align-middle text-text-primary",
                      column.className,
                    )}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
