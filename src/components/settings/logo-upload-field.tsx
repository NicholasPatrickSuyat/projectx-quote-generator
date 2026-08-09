"use client";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import {
  LOGO_ACCEPT,
  LOGO_MAX_BYTES,
  normalizeLogoMime,
  validateLogoFile,
} from "@/lib/company/validation";
import type { CompanyLogo } from "@/types/company";
import { useRef, useState, type DragEvent } from "react";

type LogoUploadFieldProps = {
  value: CompanyLogo;
  error?: string;
  disabled?: boolean;
  onChange: (logo: CompanyLogo) => void;
  onError: (message: string | undefined) => void;
};

export function LogoUploadField({
  value,
  error,
  disabled,
  onChange,
  onError,
}: LogoUploadFieldProps) {
  const inputId = "logo";
  const dropzoneId = "logo-dropzone";
  const inputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<FileReader | null>(null);
  const readTokenRef = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [reading, setReading] = useState(false);

  function abortActiveRead() {
    const active = readerRef.current;
    if (active) {
      active.abort();
      readerRef.current = null;
    }
  }

  function handleFiles(files: FileList | null) {
    if (disabled || reading || !files || files.length === 0) return;
    const file = files[0];
    const validationError = validateLogoFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }
    const mime = normalizeLogoMime(file.type, file.name);
    if (!mime) {
      onError("Logo must be a PNG, JPG, JPEG, or WebP image.");
      return;
    }

    abortActiveRead();
    const token = ++readTokenRef.current;
    setReading(true);
    const reader = new FileReader();
    readerRef.current = reader;

    reader.onload = () => {
      if (token !== readTokenRef.current) return;
      readerRef.current = null;
      setReading(false);
      const result = reader.result;
      if (typeof result !== "string") {
        onError("Could not read the selected image. Try another file.");
        return;
      }
      onError(undefined);
      onChange({
        dataUrl: result,
        fileName: file.name,
        mimeType: mime,
        byteLength: file.size,
      });
    };

    reader.onerror = () => {
      if (token !== readTokenRef.current) return;
      readerRef.current = null;
      setReading(false);
      onError("Could not read the selected image. Try another file.");
    };

    reader.onabort = () => {
      if (token !== readTokenRef.current) return;
      readerRef.current = null;
      setReading(false);
    };

    reader.readAsDataURL(file);
  }

  function openPicker() {
    if (disabled || reading) return;
    inputRef.current?.click();
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (disabled || reading) return;
    handleFiles(event.dataTransfer.files);
  }

  const busy = disabled || reading;

  return (
    <FormField
      id={inputId}
      label="Company Logo"
      error={error}
      hint={`Optional. PNG, JPG, JPEG, or WebP · max ${(LOGO_MAX_BYTES / (1024 * 1024)).toFixed(0)} MB. Shown in the app header after you save.`}
    >
      <div className="space-y-3">
        <div
          id={dropzoneId}
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-disabled={busy || undefined}
          aria-busy={reading || undefined}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-hint`}
          className={
            dragging
              ? "rounded-[var(--radius-md)] border-2 border-dashed border-primary bg-primary-subtle/60 px-4 py-6 outline-none"
              : "rounded-[var(--radius-md)] border-2 border-dashed border-border-default bg-bg-muted/40 px-4 py-6 outline-none focus-visible:border-primary-hover"
          }
          onClick={openPicker}
          onKeyDown={(event) => {
            if (busy) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openPicker();
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (!busy) setDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragging(false);
          }}
          onDrop={onDrop}
        >
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element -- session data URL preview
              <img
                src={value.dataUrl}
                alt="Company logo preview"
                className="h-16 w-16 rounded-[var(--radius-md)] border border-border-default bg-bg-surface object-contain"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-[var(--radius-md)] border border-border-default bg-bg-surface text-xs font-medium text-text-muted">
                No logo
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-medium text-text-primary">
                {reading
                  ? "Reading image…"
                  : value
                    ? "Replace company logo"
                    : "Upload company logo"}
              </p>
              <p className="text-xs text-text-secondary">
                {reading
                  ? "Please wait while the selected file is processed."
                  : "Drag and drop an image here, or press Enter to choose a file."}
              </p>
              {value && !reading ? (
                <p className="truncate text-xs text-text-muted">
                  {value.fileName} ·{" "}
                  {(value.byteLength / 1024).toFixed(1)} KB
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={LOGO_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          disabled={busy}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={openPicker}
          >
            {value ? "Replace Logo" : "Choose File"}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => {
                abortActiveRead();
                readTokenRef.current += 1;
                setReading(false);
                onError(undefined);
                onChange(null);
              }}
            >
              Remove Logo
            </Button>
          ) : null}
        </div>
      </div>
    </FormField>
  );
}
