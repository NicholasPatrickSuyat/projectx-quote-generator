"use client";

import { IconSearch } from "@/components/icons";
import { useCatalogSession } from "@/components/session/catalog-session-provider";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/input";
import { SlideOver } from "@/components/ui/slide-over";
import { filterActiveCatalogForPicker } from "@/lib/catalog/filters";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CatalogItem } from "@/types/catalog";
import { LINE_CATEGORIES, type LineCategory } from "@/types/quote";
import { useMemo, useState } from "react";

type CatalogPickerProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (items: CatalogItem[]) => void;
  /** When true, yields keyboard/pointer to a higher overlay (e.g. leave ConfirmDialog). */
  suspendInteractions?: boolean;
};

function pruneSelectedIds(
  selected: Set<string>,
  items: CatalogItem[],
): Set<string> {
  const activeIds = new Set(
    items.filter((item) => !item.archived).map((item) => item.id),
  );
  let changed = false;
  const next = new Set<string>();
  for (const id of selected) {
    if (activeIds.has(id)) {
      next.add(id);
    } else {
      changed = true;
    }
  }
  return changed ? next : selected;
}

export function CatalogPicker({
  open,
  onClose,
  onAdd,
  suspendInteractions = false,
}: CatalogPickerProps) {
  const { ready, items } = useCatalogSession();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LineCategory | "all">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [itemsSnapshot, setItemsSnapshot] = useState(items);

  // Keep selection in sync when catalog items change (e.g. archived while open).
  if (items !== itemsSnapshot) {
    setItemsSnapshot(items);
    const pruned = pruneSelectedIds(selected, items);
    if (pruned !== selected) {
      setSelected(pruned);
    }
  }

  const filtered = useMemo(
    () =>
      ready
        ? filterActiveCatalogForPicker(items, search, category)
        : [],
    [ready, items, search, category],
  );

  function toggleItem(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    setSearch("");
    setCategory("all");
    setSelected(new Set());
    onClose();
  }

  function handleAdd() {
    const chosen = items.filter(
      (item) => selected.has(item.id) && !item.archived,
    );
    if (chosen.length === 0) return;
    onAdd(chosen);
    handleClose();
  }

  return (
    <SlideOver
      open={open}
      title="Add from Catalog"
      description="Search and select active catalog items to add as line items."
      onClose={handleClose}
      wide
      suspendInteractions={suspendInteractions}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm text-text-secondary">
            {selected.size} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={selected.size === 0}
              onClick={handleAdd}
            >
              Add to Quote
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search catalog…"
            leadingIcon={<IconSearch />}
            className="flex-1"
          />
          <Select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as LineCategory | "all")
            }
            className="sm:w-40"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {LINE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </Select>
        </div>

        <ul className="divide-y divide-border-default rounded-[var(--radius-md)] border border-border-default">
          {!ready ? (
            <li className="px-4 py-8 text-center text-sm text-text-secondary">
              Loading catalog…
            </li>
          ) : filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-text-secondary">
              No active catalog items match your search.
            </li>
          ) : (
            filtered.map((item) => {
              const checked = selected.has(item.id);
              return (
                <li key={item.id}>
                  <label
                    className={cn(
                      "flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-bg-muted",
                      checked && "bg-bg-muted",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 rounded border-border-default"
                      checked={checked}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {item.name}
                        </span>
                        <span className="rounded-full bg-bg-muted px-2 py-0.5 text-xs text-text-secondary">
                          {item.category}
                        </span>
                      </span>
                      {item.description.trim() ? (
                        <span className="mt-0.5 block text-sm text-text-secondary">
                          {item.description}
                        </span>
                      ) : null}
                      <span className="mt-1 block text-sm font-medium text-text-primary">
                        {formatCurrency(item.unitPrice)}
                        {item.unit.trim() ? ` / ${item.unit}` : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </SlideOver>
  );
}
