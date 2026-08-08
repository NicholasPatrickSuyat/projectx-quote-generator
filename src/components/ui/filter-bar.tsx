"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type ArchiveToggleValue = "active" | "archived";

type ActiveArchivedToggleProps = {
  value: ArchiveToggleValue;
  onChange: (value: ArchiveToggleValue) => void;
  className?: string;
};

export function ActiveArchivedToggle({
  value,
  onChange,
  className,
}: ActiveArchivedToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label="Customer status"
    >
      {(
        [
          { id: "active", label: "Active" },
          { id: "archived", label: "Archived" },
        ] as const
      ).map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.id)}
            className={cn(
              "h-8 min-w-[5.5rem] rounded-[8px] px-3 text-sm font-medium transition-colors duration-150",
              selected
                ? "bg-primary-subtle text-primary"
                : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

type FilterBarProps = {
  children: ReactNode;
  className?: string;
};

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {children}
    </div>
  );
}
