"use client";

import { Button, buttonClassName } from "@/components/ui/button";
import { fieldControlProps, FormField } from "@/components/ui/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { CatalogFieldErrors } from "@/lib/catalog/filters";
import type { CatalogFormValues } from "@/types/catalog";
import { LINE_CATEGORIES } from "@/types/quote";

type CatalogFormProps = {
  values: CatalogFormValues;
  errors: CatalogFieldErrors;
  onChange: (values: CatalogFormValues) => void;
  onSubmit: () => void;
  formId: string;
  formError?: string | null;
};

export function CatalogForm({
  values,
  errors,
  onChange,
  onSubmit,
  formId,
  formError = null,
}: CatalogFormProps) {
  const update = <K extends keyof CatalogFormValues>(
    key: K,
    value: CatalogFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <form
      id={formId}
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <FormField id="name" label="Service Name" required error={errors.name}>
        <Input
          {...fieldControlProps("name", errors.name)}
          value={values.name}
          onChange={(event) => update("name", event.target.value)}
          autoComplete="off"
        />
      </FormField>

      <FormField
        id="category"
        label="Category"
        required
        error={errors.category}
      >
        <Select
          {...fieldControlProps("category", errors.category)}
          value={values.category}
          onChange={(event) =>
            update("category", event.target.value as CatalogFormValues["category"])
          }
        >
          {LINE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          id="unitPrice"
          label="Default Unit Price"
          required
          error={errors.unitPrice}
        >
          <Input
            {...fieldControlProps("unitPrice", errors.unitPrice)}
            type="number"
            min={0}
            step="0.01"
            value={values.unitPrice}
            onChange={(event) =>
              update("unitPrice", Number(event.target.value))
            }
          />
        </FormField>
        <FormField id="unit" label="Unit of Measure">
          <Input
            {...fieldControlProps("unit")}
            value={values.unit}
            onChange={(event) => update("unit", event.target.value)}
            placeholder="ea, hr, box…"
            autoComplete="off"
          />
        </FormField>
      </div>

      <FormField id="description" label="Description">
        <Textarea
          {...fieldControlProps("description")}
          rows={4}
          value={values.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </FormField>
    </form>
  );
}

export function CatalogFormFooter({
  formId,
  onCancel,
  submitLabel,
}: {
  formId: string;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" variant="secondary" onClick={onCancel}>
        Cancel
      </Button>
      <button
        type="submit"
        form={formId}
        className={buttonClassName({ variant: "primary" })}
      >
        {submitLabel}
      </button>
    </div>
  );
}
