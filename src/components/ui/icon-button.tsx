import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
};

export function IconButton({
  className,
  label,
  type = "button",
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-text-secondary transition-colors duration-150 hover:bg-bg-muted hover:text-text-primary disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <span className="text-[1.15rem] leading-none">{children}</span>
    </button>
  );
}
