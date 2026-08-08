import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

const controlClass =
  "w-full rounded-[var(--radius-md)] border border-border-default bg-bg-surface px-3 text-sm text-text-primary shadow-sm transition-colors duration-150 placeholder:text-text-muted hover:border-border-strong focus-visible:border-primary-hover disabled:cursor-not-allowed disabled:bg-bg-muted disabled:opacity-70";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(controlClass, "h-10", className)}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(controlClass, "min-h-24 py-2.5", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlClass, "h-10", className)} {...props}>
      {children}
    </select>
  );
}
