import { Button, buttonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import Link from "next/link";
import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  actionHref,
  secondaryLabel,
  onSecondary,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-bg-surface px-6 py-12 text-center shadow-sm",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 text-3xl text-text-secondary" aria-hidden>
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-text-secondary">{description}</p>
      ) : null}
      {(actionLabel && (onAction || actionHref)) ||
      (secondaryLabel && onSecondary) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className={buttonClassName({ variant: "primary" })}
            >
              {actionLabel}
            </Link>
          ) : null}
          {actionLabel && onAction ? (
            <Button type="button" variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button type="button" variant="secondary" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
