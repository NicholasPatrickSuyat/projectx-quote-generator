import { cn } from "@/lib/cn";
import type { HTMLAttributes, ReactNode } from "react";

type PlaceholderPanelProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  description: string;
  children?: ReactNode;
};

/** Empty shell placeholder — no business functionality. */
export function PlaceholderPanel({
  title,
  description,
  className,
  children,
  ...props
}: PlaceholderPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border-strong bg-bg-surface px-6 py-16 text-center shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    >
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-text-secondary">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </div>
  );
}
