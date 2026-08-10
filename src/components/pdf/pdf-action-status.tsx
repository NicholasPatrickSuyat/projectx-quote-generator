"use client";

import { Button } from "@/components/ui/button";
import {
  deliverPdfBlob,
  downloadFromObjectUrl,
  openPdfPlaceholderTab,
  revokePdfObjectUrl,
  type PdfDeliveryResult,
} from "@/lib/pdf/delivery";
import {
  renderFinalPdfFromSnapshot,
  renderQuotePdf,
  resolveQuotePdfMode,
} from "@/lib/pdf/render-quote-pdf";
import type { CompanySettings } from "@/types/company";
import type { Quote } from "@/types/quote";
import { useEffect, useRef, useState } from "react";

export type PdfActionState =
  | { status: "idle" }
  | { status: "generating"; label: string }
  | {
      status: "ready";
      message: string;
      delivery: PdfDeliveryResult;
      warning: string | null;
      /** False after the object URL was revoked (Download must not stay active). */
      downloadAvailable: boolean;
    }
  | { status: "error"; message: string; onRetry?: () => void };

type UseQuotePdfActionsArgs = {
  settings: CompanySettings;
  today: Date | null;
};

export function useQuotePdfActions({ settings, today }: UseQuotePdfActionsArgs) {
  const [state, setState] = useState<PdfActionState>({ status: "idle" });
  const busy = state.status === "generating";
  const lockRef = useRef(false);
  const activeUrlRef = useRef<string | null>(null);
  /** When true, the active URL was handed to a browser tab — delay revoke on dismiss. */
  const urlOpenedInTabRef = useRef(false);

  useEffect(() => {
    return () => {
      revokePdfObjectUrl(activeUrlRef.current);
      activeUrlRef.current = null;
    };
  }, []);

  function revokeActiveUrl() {
    revokePdfObjectUrl(activeUrlRef.current);
    activeUrlRef.current = null;
    urlOpenedInTabRef.current = false;
  }

  /** Revoke the previous generation before starting a new one. */
  function beginNewGeneration() {
    revokeActiveUrl();
  }

  function clearPdfState() {
    setState((prev) => {
      if (prev.status === "ready") {
        if (prev.delivery.opened || urlOpenedInTabRef.current) {
          // Tab may still need the blob URL — keep it until the next generation.
          // Drop Download from the UI by leaving idle without revoking yet.
        } else {
          revokeActiveUrl();
        }
      }
      return { status: "idle" };
    });
  }

  async function runWithLock(
    label: string,
    work: (placeholderTab: Window | null) => Promise<{
      blob: Blob;
      fileName: string;
      warning: string | null;
      successMessage: (opened: boolean) => string;
    }>,
    onError: (error: unknown) => {
      message: string;
      onRetry?: () => void;
    },
  ) {
    if (lockRef.current) return;
    lockRef.current = true;

    // Synchronous with the user gesture — before any await.
    const placeholderTab = openPdfPlaceholderTab();
    beginNewGeneration();
    setState({ status: "generating", label });

    try {
      const result = await work(placeholderTab);
      const delivery = deliverPdfBlob(
        result.blob,
        result.fileName,
        placeholderTab,
      );
      activeUrlRef.current = delivery.objectUrl;
      urlOpenedInTabRef.current = delivery.opened;
      setState({
        status: "ready",
        message: result.successMessage(delivery.opened),
        delivery,
        warning: result.warning,
        downloadAvailable: true,
      });
    } catch (error) {
      try {
        placeholderTab?.close();
      } catch {
        // ignore
      }
      const mapped = onError(error);
      setState({
        status: "error",
        message: mapped.message,
        onRetry: mapped.onRetry,
      });
    } finally {
      lockRef.current = false;
    }
  }

  async function runPreview(quote: Quote) {
    await runWithLock(
      "Generating preview…",
      async () => {
        const { blob, model } = await renderQuotePdf({
          quote,
          settings,
          mode: "preview",
          today: today ?? undefined,
        });
        return {
          blob,
          fileName: model.fileName,
          warning: model.logoWarning,
          successMessage: (opened) =>
            opened
              ? "PDF ready — opened in a new tab. You can also download a copy."
              : "PDF ready — popup blocked, so the download started instead.",
        };
      },
      (error) => ({
        message:
          error instanceof Error
            ? error.message
            : "Could not generate PDF. Try again.",
        onRetry: () => {
          void runPreview(quote);
        },
      }),
    );
  }

  async function runFinalFromSnapshot(quote: Quote) {
    if (!quote.pdfSnapshot) {
      if (lockRef.current) return;
      setState({
        status: "error",
        message:
          "This quote has no frozen PDF snapshot. Return to Draft, then Mark as Sent or generate Final PDF.",
      });
      return;
    }

    await runWithLock(
      "Generating final PDF…",
      async () => {
        const { blob, model } = await renderFinalPdfFromSnapshot(
          quote.pdfSnapshot!,
          today ?? undefined,
        );
        return {
          blob,
          fileName: model.fileName,
          warning: model.logoWarning,
          successMessage: (opened) =>
            opened
              ? "Final PDF ready — opened in a new tab. You can also download a copy."
              : "Final PDF ready — popup blocked, so the download started instead.",
        };
      },
      (error) => ({
        message:
          error instanceof Error
            ? error.message
            : "Could not generate PDF. Try again.",
        onRetry: () => {
          void runFinalFromSnapshot(quote);
        },
      }),
    );
  }

  async function runFinalAfterSend(quote: Quote) {
    if (!quote.pdfSnapshot) {
      if (lockRef.current) return;
      setState({
        status: "error",
        message: "Could not generate Final PDF because the snapshot is missing.",
      });
      return;
    }

    await runWithLock(
      "Generating final PDF…",
      async () => {
        const { blob, model } = await renderFinalPdfFromSnapshot(
          quote.pdfSnapshot!,
          today ?? undefined,
        );
        return {
          blob,
          fileName: model.fileName,
          warning: model.logoWarning,
          successMessage: (opened) =>
            opened
              ? "Quote marked Sent and Final PDF opened in a new tab."
              : "Quote marked Sent. Popup blocked — Final PDF download started.",
        };
      },
      (error) => ({
        message:
          error instanceof Error
            ? `${error.message} The quote was marked Sent, but the PDF could not be generated.`
            : "The quote was marked Sent, but the PDF could not be generated. Try Generate PDF again.",
        onRetry: () => {
          void runFinalFromSnapshot(quote);
        },
      }),
    );
  }

  function runGenerateForQuote(quote: Quote) {
    const mode = resolveQuotePdfMode(quote);
    if (mode === "final") {
      void runFinalFromSnapshot(quote);
    } else {
      void runPreview(quote);
    }
  }

  return {
    pdfState: state,
    pdfBusy: busy,
    runPreview,
    runFinalFromSnapshot,
    runFinalAfterSend,
    runGenerateForQuote,
    clearPdfState,
  };
}

export function PdfActionStatus({
  state,
  onDismiss,
}: {
  state: PdfActionState;
  onDismiss?: () => void;
}) {
  if (state.status === "idle") return null;

  if (state.status === "generating") {
    return (
      <p className="text-sm text-text-secondary" role="status" aria-live="polite">
        {state.label}
      </p>
    );
  }

  if (state.status === "error") {
    return (
      <div
        className="rounded-[var(--radius-md)] border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger"
        role="alert"
      >
        <p>{state.message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {state.onRetry ? (
            <Button type="button" size="sm" variant="secondary" onClick={state.onRetry}>
              Retry
            </Button>
          ) : null}
          {onDismiss ? (
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-[var(--radius-md)] border border-border-default bg-bg-muted/40 px-3 py-2 text-sm text-text-primary"
      role="status"
      aria-live="polite"
    >
      <p>{state.message}</p>
      {state.warning ? (
        <p className="mt-1 text-xs text-warning">{state.warning}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {state.downloadAvailable ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              downloadFromObjectUrl(
                state.delivery.objectUrl,
                state.delivery.fileName,
              )
            }
          >
            Download PDF
          </Button>
        ) : (
          <p className="text-xs text-text-secondary">
            Download expired. Generate the PDF again to download a copy.
          </p>
        )}
        {onDismiss ? (
          <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        ) : null}
      </div>
    </div>
  );
}
