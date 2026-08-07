"use client";

import { cn } from "@/lib/cn";
import {
  DATE_PRESETS,
  type DatePresetId,
} from "@/lib/dashboard/date-presets";

type DatePresetControlsProps = {
  value: DatePresetId;
  onChange: (value: DatePresetId) => void;
};

export function DatePresetControls({
  value,
  onChange,
}: DatePresetControlsProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Date range"
    >
      {DATE_PRESETS.map((preset) => {
        const selected = preset.id === value;
        return (
          <button
            key={preset.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(preset.id)}
            className={cn(
              "h-9 rounded-[var(--radius-md)] px-3 text-sm font-medium transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover",
              selected
                ? "bg-primary text-text-inverse shadow-sm"
                : "border border-border-default bg-bg-surface text-text-secondary hover:bg-bg-muted hover:text-text-primary",
            )}
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
