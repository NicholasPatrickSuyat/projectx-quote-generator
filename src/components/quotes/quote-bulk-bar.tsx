"use client";

import { Button } from "@/components/ui/button";

type QuoteBulkBarProps = {
  selectedCount: number;
  archiveMode: boolean;
  canRestore?: boolean;
  onArchive: () => void;
  onRestore: () => void;
  onClear: () => void;
};

export function QuoteBulkBar({
  selectedCount,
  archiveMode,
  canRestore = false,
  onArchive,
  onRestore,
  onClear,
}: QuoteBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Bulk quote actions"
      className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border-default bg-bg-surface px-4 py-3 shadow-md"
    >
      <p className="text-sm font-medium text-text-primary">
        {selectedCount} quote{selectedCount === 1 ? "" : "s"} selected
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {archiveMode ? (
          canRestore ? (
            <Button type="button" variant="secondary" size="sm" onClick={onRestore}>
              Restore selected
            </Button>
          ) : null
        ) : (
          <Button type="button" variant="secondary" size="sm" onClick={onArchive}>
            Archive selected
          </Button>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={onClear}>
          Clear selection
        </Button>
      </div>
    </div>
  );
}
