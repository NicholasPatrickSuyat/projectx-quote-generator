"use client";

import { LogoUploadField } from "@/components/settings/logo-upload-field";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { useCompanySettingsSession } from "@/components/session/company-settings-session-provider";
import { useUnsavedNavigationGuard } from "@/lib/navigation/use-unsaved-navigation-guard";
import { Button } from "@/components/ui/button";
import { FormField, fieldControlProps } from "@/components/ui/form-field";
import { Input, Select, Textarea } from "@/components/ui/input";
import {
  companySettingsToFormValues,
} from "@/lib/company/demo-defaults";
import {
  companySettingsFormsEqual,
  firstSettingsFieldError,
  PDF_FOOTER_MAX,
  PDF_MESSAGE_MAX,
  PDF_TERMS_MAX,
  validateCompanySettingsForm,
  type CompanySettingsFieldErrors,
} from "@/lib/company/validation";
import { US_STATE_OPTIONS } from "@/lib/customers/us-locations";
import { cn } from "@/lib/cn";
import type {
  CompanySettingsFormValues,
  SettingsTabId,
} from "@/types/company";
import {
  parseSettingsTab,
  SETTINGS_TABS,
  settingsFieldLabel,
  tabForSettingsField,
} from "@/types/company";
import type { DiscountType } from "@/types/quote";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

const lastSavedFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatLastSaved(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return lastSavedFormatter.format(date);
}

function focusSettingsField(field: string) {
  const targetId = field === "logo" ? "logo-dropzone" : field;
  const el = document.getElementById(targetId);
  if (el instanceof HTMLElement) {
    el.focus();
    return;
  }
  document.getElementById(field)?.focus();
}

export function SettingsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, settings, canManageSettings, saveSettings } =
    useCompanySettingsSession();

  const tab = parseSettingsTab(searchParams.get("tab"));
  const [formValues, setFormValues] = useState<CompanySettingsFormValues>(
    companySettingsToFormValues(settings),
  );
  const [baseline, setBaseline] = useState<CompanySettingsFormValues>(
    companySettingsToFormValues(settings),
  );
  const [syncedKey, setSyncedKey] = useState(settings.updatedAt);
  const [errors, setErrors] = useState<CompanySettingsFieldErrors>({});
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(
    null,
  );
  const [focusedTabId, setFocusedTabId] = useState<SettingsTabId>(tab);
  const [pendingFocusField, setPendingFocusField] = useState<string | null>(
    null,
  );
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  if (ready && settings.updatedAt !== syncedKey) {
    const next = companySettingsToFormValues(settings);
    setSyncedKey(settings.updatedAt);
    setFormValues(next);
    setBaseline(next);
    setErrors({});
    setSaveSuccess(false);
    setValidationMessage(null);
  }

  const dirty = !companySettingsFormsEqual(formValues, baseline);
  const editable = canManageSettings;
  const { leaveDialog } = useUnsavedNavigationGuard({
    isDirty: dirty && editable,
    shouldIgnoreHref: (url) =>
      url.pathname === "/settings" &&
      window.location.pathname === "/settings",
    description:
      "You have unsaved settings edits. Discard them and leave this page?",
    confirmLabel: "Discard Changes",
    cancelLabel: "Keep Editing",
  });

  useEffect(() => {
    if (!pendingFocusField) return;
    if (tabForSettingsField(pendingFocusField) !== tab) return;

    const timer = window.setTimeout(() => {
      focusSettingsField(pendingFocusField);
      setPendingFocusField(null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [tab, pendingFocusField]);

  function updateField<K extends keyof CompanySettingsFormValues>(
    key: K,
    value: CompanySettingsFormValues[K],
  ) {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && key !== "logo") return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSaveSuccess(false);
    setValidationMessage(null);
  }

  function setTab(next: SettingsTabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "profile") {
      params.delete("tab");
    } else {
      params.set("tab", next);
    }
    const query = params.toString();
    router.replace(query ? `/settings?${query}` : "/settings", {
      scroll: false,
    });
    setFocusedTabId(next);
  }

  function handleTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const count = SETTINGS_TABS.length;
    let nextIndex = index;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        nextIndex = (index + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        nextIndex = (index - 1 + count) % count;
        break;
      case "Home":
        event.preventDefault();
        nextIndex = 0;
        break;
      case "End":
        event.preventDefault();
        nextIndex = count - 1;
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        setTab(SETTINGS_TABS[index].id);
        return;
      default:
        return;
    }

    const nextId = SETTINGS_TABS[nextIndex].id;
    setFocusedTabId(nextId);
    tabRefs.current[nextIndex]?.focus();
  }

  function handleReset() {
    setFormValues(baseline);
    setErrors({});
    setSaveSuccess(false);
    setValidationMessage(null);
  }

  function handleSave() {
    if (!editable) return;
    const nextErrors = validateCompanySettingsForm(formValues);
    setErrors(nextErrors);
    const firstKey = firstSettingsFieldError(nextErrors);
    if (firstKey) {
      const errorCount = Object.keys(nextErrors).length;
      const targetTab = tabForSettingsField(firstKey);
      const tabLabel =
        SETTINGS_TABS.find((item) => item.id === targetTab)?.label ??
        "Settings";
      setSaveSuccess(false);
      setValidationMessage(
        `Could not save settings. Fix ${errorCount} ${errorCount === 1 ? "error" : "errors"}, starting with ${settingsFieldLabel(firstKey)} on the ${tabLabel} tab.`,
      );
      if (targetTab !== tab) {
        setTab(targetTab);
        setPendingFocusField(firstKey);
      } else {
        focusSettingsField(firstKey);
      }
      return;
    }

    const saved = saveSettings(formValues);
    const next = companySettingsToFormValues(saved);
    setFormValues(next);
    setBaseline(next);
    setSyncedKey(saved.updatedAt);
    setErrors({});
    setValidationMessage(null);
    setSaveSuccess(true);
  }

  if (!ready) {
    return (
      <PageContainer>
        <PageHeader
          title="Company Settings"
          description="Company profile, quote defaults, and PDF defaults."
        />
        <p className="text-sm text-text-secondary">Loading settings…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="pb-28">
      <PageHeader
        title="Company Settings"
        description="Manage company identity, quote defaults, and PDF defaults. Changes apply to newly created quotes only."
      />

      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        {dirty ? (
          <span className="font-medium text-warning">● Unsaved changes</span>
        ) : (
          <span className="text-text-secondary">All changes saved</span>
        )}
        <span className="text-text-muted">
          Last saved {formatLastSaved(settings.updatedAt)}
        </span>
        {!editable ? (
          <span className="text-text-secondary">
            Editing requires Admin access.
          </span>
        ) : null}
      </div>

      <div
        role="tablist"
        aria-label="Settings sections"
        className="mb-6 flex flex-wrap gap-2 border-b border-border-default pb-3"
      >
        {SETTINGS_TABS.map((item, index) => {
          const selected = tab === item.id;
          const focused = focusedTabId === item.id;
          return (
            <button
              key={item.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`settings-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`settings-panel-${item.id}`}
              tabIndex={focused ? 0 : -1}
              className={cn(
                "rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-150",
                selected
                  ? "bg-primary-subtle text-primary"
                  : "text-text-secondary hover:bg-bg-muted hover:text-text-primary",
              )}
              onClick={() => setTab(item.id)}
              onFocus={() => setFocusedTabId(item.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
        className="rounded-[var(--radius-md)] border border-border-default bg-bg-surface p-4 shadow-sm sm:p-6"
      >
        {tab === "profile" ? (
          <ProfileFields
            values={formValues}
            errors={errors}
            disabled={!editable}
            onChange={updateField}
            onLogoError={(message) => {
              setErrors((prev) => {
                if (!message) {
                  const next = { ...prev };
                  delete next.logo;
                  return next;
                }
                return { ...prev, logo: message };
              });
              setSaveSuccess(false);
              setValidationMessage(null);
            }}
          />
        ) : null}

        {tab === "defaults" ? (
          <DefaultsFields
            values={formValues}
            errors={errors}
            disabled={!editable}
            onChange={updateField}
          />
        ) : null}

        {tab === "pdf" ? (
          <PdfFields
            values={formValues}
            errors={errors}
            disabled={!editable}
            onChange={updateField}
          />
        ) : null}
      </div>

      <p className="mt-4 text-sm text-text-secondary">
        Impact: Future quotes inherit the latest saved defaults. Existing Draft
        quotes keep their stored values. Sent quotes stay unchanged. Draft PDF
        preview uses the latest saved company branding. Final PDFs for Sent
        quotes use the frozen snapshot captured when the quote was marked Sent.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-default bg-bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="min-h-5 text-sm" aria-live="polite">
            {validationMessage ? (
              <span className="font-medium text-danger">{validationMessage}</span>
            ) : saveSuccess && !dirty ? (
              <span className="font-medium text-success">Settings saved.</span>
            ) : dirty ? (
              <span className="text-text-secondary">
                You have unsaved changes.
              </span>
            ) : (
              <span className="text-text-muted">Ready to edit.</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={!editable || !dirty}
              onClick={handleReset}
            >
              Reset to Last Saved
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!editable || !dirty}
              onClick={handleSave}
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>

      {leaveDialog}
    </PageContainer>
  );
}

type FieldsProps = {
  values: CompanySettingsFormValues;
  errors: CompanySettingsFieldErrors;
  disabled: boolean;
  onChange: <K extends keyof CompanySettingsFormValues>(
    key: K,
    value: CompanySettingsFormValues[K],
  ) => void;
};

function ProfileFields({
  values,
  errors,
  disabled,
  onChange,
  onLogoError,
}: FieldsProps & { onLogoError: (message: string | undefined) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Company Profile
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Identity and contact details shown in the app shell and future PDFs.
        </p>
      </div>

      <LogoUploadField
        value={values.logo}
        error={errors.logo}
        disabled={disabled}
        onChange={(logo) => onChange("logo", logo)}
        onError={onLogoError}
      />

      <FormField
        id="companyName"
        label="Company Name"
        required
        error={errors.companyName}
      >
        <Input
          {...fieldControlProps("companyName", errors.companyName)}
          value={values.companyName}
          disabled={disabled}
          onChange={(event) => onChange("companyName", event.target.value)}
          autoComplete="organization"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="phone" label="Phone Number" required error={errors.phone}>
          <Input
            {...fieldControlProps("phone", errors.phone)}
            value={values.phone}
            disabled={disabled}
            onChange={(event) => onChange("phone", event.target.value)}
            autoComplete="tel"
          />
        </FormField>
        <FormField
          id="email"
          label="Email Address"
          required
          error={errors.email}
        >
          <Input
            {...fieldControlProps("email", errors.email)}
            type="email"
            value={values.email}
            disabled={disabled}
            onChange={(event) => onChange("email", event.target.value)}
            autoComplete="email"
          />
        </FormField>
      </div>

      <FormField
        id="website"
        label="Website"
        error={errors.website}
        hint="Optional. example.com or https://example.com."
      >
        <Input
          {...fieldControlProps("website", errors.website)}
          value={values.website}
          disabled={disabled}
          onChange={(event) => onChange("website", event.target.value)}
          autoComplete="url"
          placeholder="https://"
        />
      </FormField>

      <FormField
        id="street"
        label="Street Address"
        required
        error={errors.street}
      >
        <Input
          {...fieldControlProps("street", errors.street)}
          value={values.street}
          disabled={disabled}
          onChange={(event) => onChange("street", event.target.value)}
          autoComplete="street-address"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="city" label="City" required error={errors.city}>
          <Input
            {...fieldControlProps("city", errors.city)}
            value={values.city}
            disabled={disabled}
            onChange={(event) => onChange("city", event.target.value)}
            autoComplete="address-level2"
          />
        </FormField>
        <FormField id="state" label="State" required error={errors.state}>
          <Select
            {...fieldControlProps("state", errors.state)}
            value={values.state}
            disabled={disabled}
            onChange={(event) => onChange("state", event.target.value)}
            autoComplete="address-level1"
          >
            <option value="">Select state</option>
            {US_STATE_OPTIONS.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code} — {state.name}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField id="zip" label="ZIP Code" required error={errors.zip}>
          <Input
            {...fieldControlProps("zip", errors.zip)}
            value={values.zip}
            disabled={disabled}
            onChange={(event) => onChange("zip", event.target.value)}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
          />
        </FormField>
      </div>
    </div>
  );
}

function DefaultsFields({ values, errors, disabled, onChange }: FieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          Quote Defaults
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Applied when creating new quotes. Existing quotes are never updated
          automatically.
        </p>
      </div>

      <FormField
        id="currency"
        label="Currency"
        required
        hint="Currency is fixed to USD in Version 1."
      >
        <Input
          {...fieldControlProps("currency")}
          value="USD"
          disabled
          readOnly
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="taxRate"
          label="Default Tax Rate (%)"
          required
          error={errors.taxRate}
        >
          <Input
            {...fieldControlProps("taxRate", errors.taxRate)}
            type="number"
            min={0}
            step="0.01"
            value={Number.isFinite(values.taxRate) ? values.taxRate : ""}
            disabled={disabled}
            onChange={(event) =>
              onChange("taxRate", Number(event.target.value))
            }
          />
        </FormField>
        <FormField
          id="quoteValidityDays"
          label="Default Quote Validity (days)"
          required
          error={errors.quoteValidityDays}
        >
          <Input
            {...fieldControlProps(
              "quoteValidityDays",
              errors.quoteValidityDays,
            )}
            type="number"
            min={1}
            step={1}
            value={
              Number.isFinite(values.quoteValidityDays)
                ? values.quoteValidityDays
                : ""
            }
            disabled={disabled}
            onChange={(event) =>
              onChange(
                "quoteValidityDays",
                Number.parseInt(event.target.value, 10) || 0,
              )
            }
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="discountType" label="Default Discount Type">
          <Select
            {...fieldControlProps("discountType")}
            value={values.discountType}
            disabled={disabled}
            onChange={(event) =>
              onChange("discountType", event.target.value as DiscountType)
            }
          >
            <option value="none">None</option>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </Select>
        </FormField>
        <FormField
          id="discountValue"
          label="Default Discount Value"
          error={errors.discountValue}
        >
          <Input
            {...fieldControlProps("discountValue", errors.discountValue)}
            type="number"
            min={0}
            step="0.01"
            value={
              Number.isFinite(values.discountValue) ? values.discountValue : ""
            }
            disabled={disabled || values.discountType === "none"}
            onChange={(event) =>
              onChange("discountValue", Number(event.target.value))
            }
          />
        </FormField>
      </div>

      <FormField
        id="preparedBy"
        label="Default Prepared By"
        hint="Stored for compatibility. While demo authentication is active, new quotes use the signed-in employee’s name. Admins can override Prepared By on the quote."
      >
        <Input
          {...fieldControlProps("preparedBy")}
          value={values.preparedBy}
          disabled={disabled}
          onChange={(event) => onChange("preparedBy", event.target.value)}
        />
      </FormField>
    </div>
  );
}

function PdfFields({ values, errors, disabled, onChange }: FieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-text-primary">
          PDF Defaults
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Default PDF content for new quotes. PDF generation arrives in a later
          milestone; these fields are stored now for that work.
        </p>
      </div>

      <FormField
        id="customerFacingMessage"
        label="Default Customer-Facing Message"
        error={errors.customerFacingMessage}
        hint={`${values.customerFacingMessage.length.toLocaleString()} / ${PDF_MESSAGE_MAX.toLocaleString()} characters`}
      >
        <Textarea
          {...fieldControlProps(
            "customerFacingMessage",
            errors.customerFacingMessage,
          )}
          value={values.customerFacingMessage}
          disabled={disabled}
          rows={5}
          onChange={(event) =>
            onChange("customerFacingMessage", event.target.value)
          }
        />
      </FormField>

      <FormField
        id="termsAndConditions"
        label="Default Terms and Conditions"
        error={errors.termsAndConditions}
        hint={`${values.termsAndConditions.length.toLocaleString()} / ${PDF_TERMS_MAX.toLocaleString()} characters`}
      >
        <Textarea
          {...fieldControlProps(
            "termsAndConditions",
            errors.termsAndConditions,
          )}
          value={values.termsAndConditions}
          disabled={disabled}
          rows={6}
          onChange={(event) =>
            onChange("termsAndConditions", event.target.value)
          }
        />
      </FormField>

      <FormField
        id="pdfFooterText"
        label="PDF Footer Text"
        error={errors.pdfFooterText}
        hint={`${values.pdfFooterText.length.toLocaleString()} / ${PDF_FOOTER_MAX.toLocaleString()} characters`}
      >
        <Textarea
          {...fieldControlProps("pdfFooterText", errors.pdfFooterText)}
          value={values.pdfFooterText}
          disabled={disabled}
          rows={3}
          onChange={(event) => onChange("pdfFooterText", event.target.value)}
        />
      </FormField>
    </div>
  );
}
