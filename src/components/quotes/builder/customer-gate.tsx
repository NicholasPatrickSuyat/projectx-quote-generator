"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { customerDisplayName, type Customer } from "@/types/customer";
import type { QuoteCustomerSnapshot } from "@/types/quote";

type CustomerGateProps = {
  snapshot: QuoteCustomerSnapshot | null;
  customerError?: string;
  editable: boolean;
  canChangeCustomer: boolean;
  activeCustomers: Customer[];
  picking: boolean;
  onStartPick: () => void;
  onCancelPick: () => void;
  onSelectCustomer: (customerId: string) => void;
  onCreateCustomer: () => void;
  onChangeCustomer: () => void;
};

function CustomerDetails({ snapshot }: { snapshot: QuoteCustomerSnapshot }) {
  const address = [snapshot.street, snapshot.city, snapshot.state, snapshot.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <dl className="grid gap-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-text-secondary">Name</dt>
        <dd className="font-medium text-text-primary">{snapshot.customerName}</dd>
      </div>
      {snapshot.companyName ? (
        <div>
          <dt className="text-text-secondary">Company</dt>
          <dd className="font-medium text-text-primary">{snapshot.companyName}</dd>
        </div>
      ) : null}
      {snapshot.phone ? (
        <div>
          <dt className="text-text-secondary">Phone</dt>
          <dd className="font-medium text-text-primary">{snapshot.phone}</dd>
        </div>
      ) : null}
      {snapshot.email ? (
        <div>
          <dt className="text-text-secondary">Email</dt>
          <dd className="font-medium text-text-primary">{snapshot.email}</dd>
        </div>
      ) : null}
      {address ? (
        <div className="sm:col-span-2">
          <dt className="text-text-secondary">Service Address</dt>
          <dd className="font-medium text-text-primary">{address}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function CustomerGate({
  snapshot,
  customerError,
  editable,
  canChangeCustomer,
  activeCustomers,
  picking,
  onStartPick,
  onCancelPick,
  onSelectCustomer,
  onCreateCustomer,
  onChangeCustomer,
}: CustomerGateProps) {
  const hasCustomer = Boolean(snapshot?.customerId);

  if (picking && editable) {
    return (
      <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Select Customer</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onCancelPick}>
            Cancel
          </Button>
        </div>
        <div className="space-y-4">
          <FormField
            id="customer-picker"
            label="Active Customer"
            required
            error={customerError}
          >
            <Select
              id="customer-picker"
              defaultValue=""
              aria-invalid={customerError ? true : undefined}
              onChange={(event) => {
                const id = event.target.value;
                if (id) onSelectCustomer(id);
              }}
            >
              <option value="" disabled>
                Choose a customer…
              </option>
              {activeCustomers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customerDisplayName(customer)}
                  {customer.companyName ? ` — ${customer.companyName}` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onCreateCustomer}>
              Create New Customer
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-text-primary">Customer</h2>
          {hasCustomer ? (
            <StatusBadge label="Selected" tone="active" />
          ) : (
            <StatusBadge label="Required" tone="draft" />
          )}
        </div>
        {editable && canChangeCustomer ? (
          <div className="flex flex-wrap gap-2">
            {hasCustomer ? (
              <Button type="button" variant="secondary" size="sm" onClick={onChangeCustomer}>
                Change Customer
              </Button>
            ) : (
              <Button type="button" variant="primary" size="sm" onClick={onStartPick}>
                Select Customer
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {customerError && !picking ? (
        <p className="mb-3 text-xs text-danger" role="alert">
          {customerError}
        </p>
      ) : null}

      {hasCustomer && snapshot ? (
        <CustomerDetails snapshot={snapshot} />
      ) : (
        <p className="text-sm text-text-secondary">
          A customer is required before you can save this quote. Select an existing
          customer or create a new one.
        </p>
      )}

      {editable && !hasCustomer && !picking ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCreateCustomer}>
            Create New Customer
          </Button>
        </div>
      ) : null}
    </section>
  );
}
