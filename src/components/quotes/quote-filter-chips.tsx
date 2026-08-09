"use client";

import { IconClose } from "@/components/icons";
import { Button } from "@/components/ui/button";
import type { QuoteFilterChip } from "@/lib/quotes/filters";

type QuoteFilterChipsProps = {
  chips: QuoteFilterChip[];
  onRemove: (chipId: string) => void;
  onClearAll: () => void;
};

export function QuoteFilterChips({
  chips,
  onRemove,
  onClearAll,
}: QuoteFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          onClick={() => onRemove(chip.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-bg-surface px-2.5 py-1 text-xs font-medium text-text-primary shadow-sm transition-colors hover:bg-bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-hover"
          aria-label={`Remove filter ${chip.label}`}
        >
          {chip.label}
          <IconClose className="size-3.5 text-text-secondary" aria-hidden />
        </button>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
        Clear all
      </Button>
    </div>
  );
}
