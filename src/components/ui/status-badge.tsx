import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

const tones = {
  draft:
    "bg-[var(--px-status-draft-bg)] text-[var(--px-status-draft-text)]",
  sent: "bg-[var(--px-status-sent-bg)] text-[var(--px-status-sent-text)]",
  accepted:
    "bg-[var(--px-status-accepted-bg)] text-[var(--px-status-accepted-text)]",
  rejected:
    "bg-[var(--px-status-rejected-bg)] text-[var(--px-status-rejected-text)]",
  expired:
    "bg-[var(--px-status-expired-bg)] text-[var(--px-status-expired-text)]",
  archived:
    "bg-[var(--px-status-archived-bg)] text-[var(--px-status-archived-text)]",
  active:
    "bg-[var(--px-status-accepted-bg)] text-[var(--px-status-accepted-text)]",
} as const;

export type StatusBadgeTone = keyof typeof tones;

type StatusBadgeProps = {
  label: string;
  tone: StatusBadgeTone;
  icon?: ReactNode;
  className?: string;
};

export function StatusBadge({ label, tone, icon, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {icon}
      {label}
    </span>
  );
}
