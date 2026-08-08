"use client";

import { Button, buttonClassName } from "@/components/ui/button";
import {
  fieldControlProps,
  FormField,
} from "@/components/ui/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import type { CustomerFieldErrors } from "@/lib/customers/filters";
import {
  getCitySuggestionsForState,
  US_STATE_OPTIONS,
} from "@/lib/customers/us-locations";
import type { CustomerFormValues } from "@/types/customer";

type CustomerFormProps = {
  values: CustomerFormValues;
  errors: CustomerFieldErrors;
  onChange: (values: CustomerFormValues) => void;
  onSubmit: () => void;
  formId: string;
};

export function CustomerForm({
  values,
  errors,
  onChange,
  onSubmit,
  formId,
}: CustomerFormProps) {
  const update = <K extends keyof CustomerFormValues>(
    key: K,
    value: CustomerFormValues[K],
  ) => {
    onChange({ ...values, [key]: value });
  };

  const citySuggestions = getCitySuggestionsForState(values.state);
  const cityListId = `${formId}-city-suggestions`;

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="firstName" label="First Name" required error={errors.firstName}>
          <Input
            {...fieldControlProps("firstName", errors.firstName)}
            value={values.firstName}
            onChange={(event) => update("firstName", event.target.value)}
            autoComplete="given-name"
          />
        </FormField>
        <FormField id="lastName" label="Last Name" required error={errors.lastName}>
          <Input
            {...fieldControlProps("lastName", errors.lastName)}
            value={values.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            autoComplete="family-name"
          />
        </FormField>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField id="phone" label="Phone Number" required error={errors.phone}>
          <Input
            {...fieldControlProps("phone", errors.phone)}
            value={values.phone}
            onChange={(event) => update("phone", event.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />
        </FormField>
        <FormField id="email" label="Email Address" error={errors.email}>
          <Input
            {...fieldControlProps("email", errors.email)}
            type="email"
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            autoComplete="email"
          />
        </FormField>
      </div>

      <FormField id="companyName" label="Company Name">
        <Input
          {...fieldControlProps("companyName")}
          value={values.companyName}
          onChange={(event) => update("companyName", event.target.value)}
          autoComplete="organization"
        />
      </FormField>

      <FormField id="street" label="Service Address (Street)" required error={errors.street}>
        <Input
          {...fieldControlProps("street", errors.street)}
          value={values.street}
          onChange={(event) => update("street", event.target.value)}
          autoComplete="street-address"
        />
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField
          id="city"
          label="City"
          required
          error={errors.city}
          hint={
            citySuggestions.length > 0
              ? "Suggestions available for this state — you can still type any city."
              : undefined
          }
        >
          <Input
            {...fieldControlProps(
              "city",
              errors.city,
              citySuggestions.length > 0
                ? "Suggestions available for this state — you can still type any city."
                : undefined,
            )}
            list={cityListId}
            value={values.city}
            onChange={(event) => update("city", event.target.value)}
            autoComplete="off"
          />
          <datalist id={cityListId}>
            {citySuggestions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </FormField>
        <FormField id="state" label="State" required error={errors.state}>
          <Select
            {...fieldControlProps("state", errors.state)}
            value={values.state}
            onChange={(event) => update("state", event.target.value)}
            autoComplete="address-level1"
          >
            {US_STATE_OPTIONS.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="zip" label="ZIP Code" required error={errors.zip}>
          {/*
            Future: after a valid 5-digit ZIP, look up City/State from an approved
            data source and suggest/populate those fields (user may still correct them).
          */}
          <Input
            {...fieldControlProps("zip", errors.zip)}
            value={values.zip}
            onChange={(event) => update("zip", event.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
          />
        </FormField>
      </div>

      <FormField
        id="internalNotes"
        label="Internal Notes"
        hint="Employees only — never shown on customer-facing quotes."
      >
        <Textarea
          {...fieldControlProps(
            "internalNotes",
            undefined,
            "Employees only — never shown on customer-facing quotes.",
          )}
          value={values.internalNotes}
          onChange={(event) => update("internalNotes", event.target.value)}
          rows={4}
        />
      </FormField>

      {/* Enter submits via the footer button associated with this form id */}
      <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only">
        Save Customer
      </button>
    </form>
  );
}

type CustomerFormFooterProps = {
  formId: string;
  onCancel: () => void;
};

export function CustomerFormFooter({
  formId,
  onCancel,
}: CustomerFormFooterProps) {
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
        Save Customer
      </button>
    </div>
  );
}
