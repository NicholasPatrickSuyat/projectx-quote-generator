import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode } from "react";

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: string;
  leadingIcon?: ReactNode;
};

export function SearchInput({
  className,
  label = "Search",
  leadingIcon,
  id,
  ...props
}: SearchInputProps) {
  const inputId = id ?? "search-input";

  return (
    <div className="relative w-full min-w-0">
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      {leadingIcon ? (
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-secondary">
          {leadingIcon}
        </span>
      ) : null}
      <input
        id={inputId}
        type="search"
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] border border-border-default bg-bg-surface text-sm text-text-primary shadow-sm transition-colors duration-150 placeholder:text-text-muted hover:border-border-strong focus-visible:border-primary-hover",
          leadingIcon ? "pr-3 pl-10" : "px-3",
          className,
        )}
        {...props}
      />
    </div>
  );
}
