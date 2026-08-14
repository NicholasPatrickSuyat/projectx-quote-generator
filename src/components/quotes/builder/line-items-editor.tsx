"use client";

import {
  IconChevronDown,
  IconChevronUp,
  IconPlus,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { IconButton } from "@/components/ui/icon-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Textarea } from "@/components/ui/input";
import { computeLineTotal } from "@/lib/quotes/calculations";
import { createEmptyLine, moveLine } from "@/lib/quotes/mutations";
import { createLineId } from "@/lib/quotes/demo-data";
import { formatCurrency } from "@/lib/format";
import {
  LINE_CATEGORIES,
  type LineCategory,
  type QuoteLineItem,
} from "@/types/quote";
import type { QuoteFieldErrors } from "@/lib/quotes/validation";
import { useState } from "react";

type LineItemsEditorProps = {
  lines: QuoteLineItem[];
  editable: boolean;
  lineErrors?: QuoteFieldErrors["lines"];
  onChange: (lines: QuoteLineItem[]) => void;
  onOpenCatalog: () => void;
};

function updateLine(
  lines: QuoteLineItem[],
  lineId: string,
  patch: Partial<QuoteLineItem>,
): QuoteLineItem[] {
  return lines.map((line) => {
    if (line.id !== lineId) return line;
    const next = { ...line, ...patch };
    return {
      ...next,
      lineTotal: computeLineTotal(next.quantity, next.unitPrice),
    };
  });
}

export function LineItemsEditor({
  lines,
  editable,
  lineErrors,
  onChange,
  onOpenCatalog,
}: LineItemsEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(lineId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  }

  function addBlankLine(category: LineCategory = "Services") {
    onChange([...lines, createEmptyLine(lines, category)]);
  }

  function duplicateLine(line: QuoteLineItem) {
    const copy: QuoteLineItem = {
      ...line,
      id: createLineId(),
      sortOrder: lines.length,
      lineTotal: computeLineTotal(line.quantity, line.unitPrice),
    };
    onChange([...lines, copy]);
  }

  function removeLine(lineId: string) {
    onChange(
      lines
        .filter((line) => line.id !== lineId)
        .map((line, index) => ({ ...line, sortOrder: index })),
    );
  }

  function move(lineId: string, direction: "up" | "down") {
    onChange(moveLine(lines, lineId, direction));
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default px-4 py-3">
        <h2 className="text-sm font-semibold text-text-primary">Line Items</h2>
        {editable ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onOpenCatalog}>
              Add from Catalog
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => addBlankLine()}
            >
              <IconPlus />
              Add Line
            </Button>
          </div>
        ) : null}
      </div>

      {lines.length === 0 ? (
        <EmptyState
          className="border-0 shadow-none"
          title="No line items yet"
          description={
            editable
              ? "Add items from the catalog or create blank lines."
              : "This quote has no line items."
          }
          actionLabel={editable ? "Add from Catalog" : undefined}
          onAction={editable ? onOpenCatalog : undefined}
          secondaryLabel={editable ? "Add Blank Line" : undefined}
          onSecondary={editable ? () => addBlankLine() : undefined}
        />
      ) : (
        <ul className="divide-y divide-border-default">
          {lines.map((line, index) => {
            const errors = lineErrors?.[line.id];
            const notesOpen = expanded.has(line.id);
            const atTop = index === 0;
            const atBottom = index === lines.length - 1;

            return (
              <li key={line.id} className="px-4 py-4">
                <div className="grid gap-3 lg:grid-cols-12 lg:items-start">
                  <div className="lg:col-span-3">
                    <FormField
                      id={`line-${line.id}-category`}
                      label="Category"
                    >
                      <Select
                        {...fieldControlProps(`line-${line.id}-category`)}
                        value={line.category}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              category: event.target.value as LineCategory,
                            }),
                          )
                        }
                      >
                        {LINE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </Select>
                    </FormField>
                  </div>

                  <div className="lg:col-span-5">
                    <FormField
                      id={`line-${line.id}-description`}
                      label="Description"
                      required
                      error={errors?.description}
                    >
                      <Input
                        {...fieldControlProps(
                          `line-${line.id}-description`,
                          errors?.description,
                        )}
                        value={line.description}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              description: event.target.value,
                            }),
                          )
                        }
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-4">
                    <FormField
                      id={`line-${line.id}-qty`}
                      label="Qty"
                      required
                      error={errors?.quantity}
                    >
                      <Input
                        {...fieldControlProps(
                          `line-${line.id}-qty`,
                          errors?.quantity,
                        )}
                        type="number"
                        min={0}
                        step="any"
                        value={line.quantity}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              quantity: Number(event.target.value),
                            }),
                          )
                        }
                      />
                    </FormField>
                    <FormField id={`line-${line.id}-unit`} label="Unit">
                      <Input
                        {...fieldControlProps(`line-${line.id}-unit`)}
                        value={line.unit}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              unit: event.target.value,
                            }),
                          )
                        }
                      />
                    </FormField>
                    <FormField
                      id={`line-${line.id}-price`}
                      label="Unit Price"
                      required
                      error={errors?.unitPrice}
                    >
                      <Input
                        {...fieldControlProps(
                          `line-${line.id}-price`,
                          errors?.unitPrice,
                        )}
                        type="number"
                        min={0}
                        step="0.01"
                        value={line.unitPrice}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              unitPrice: Number(event.target.value),
                            }),
                          )
                        }
                      />
                    </FormField>
                    <FormField id={`line-${line.id}-total`} label="Line Total">
                      <div className="flex h-10 items-center text-sm font-semibold text-text-primary">
                        {formatCurrency(line.lineTotal)}
                      </div>
                    </FormField>
                  </div>
                </div>

                {notesOpen ? (
                  <div className="mt-3">
                    <FormField
                      id={`line-${line.id}-notes`}
                      label="Internal Note"
                      hint="Employees only — not shown on customer-facing quotes."
                    >
                      <Textarea
                        {...fieldControlProps(
                          `line-${line.id}-notes`,
                          undefined,
                          "Employees only — not shown on customer-facing quotes.",
                        )}
                        rows={2}
                        value={line.internalNotes}
                        disabled={!editable}
                        onChange={(event) =>
                          onChange(
                            updateLine(lines, line.id, {
                              internalNotes: event.target.value,
                            }),
                          )
                        }
                      />
                    </FormField>
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(line.id)}
                  >
                    {notesOpen ? "Hide Note" : "Internal Note"}
                  </Button>
                  {editable ? (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateLine(line)}
                      >
                        Duplicate
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLine(line.id)}
                      >
                        Remove
                      </Button>
                      <span className="mx-1 hidden h-4 w-px bg-border-default sm:inline" />
                      <IconButton
                        label="Move line up"
                        disabled={atTop}
                        onClick={() => move(line.id, "up")}
                        className="h-9 w-9"
                      >
                        <IconChevronUp />
                      </IconButton>
                      <IconButton
                        label="Move line down"
                        disabled={atBottom}
                        onClick={() => move(line.id, "down")}
                        className="h-9 w-9"
                      >
                        <IconChevronDown />
                      </IconButton>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
