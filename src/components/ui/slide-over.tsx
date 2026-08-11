"use client";

import { IconClose } from "@/components/icons";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/cn";
import { lockBodyScroll } from "@/lib/navigation/body-scroll-lock";
import {
  useEffect,
  useId,
  useRef,
  type ReactNode,
} from "react";

type SlideOverProps = {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** When true, keyboard handling yields to a higher overlay (e.g. ConfirmDialog). */
  suspendInteractions?: boolean;
  /** Change while open to move focus into the first editable field (e.g. Summary → Edit). */
  focusKey?: string | number;
};

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    if (element.hasAttribute("disabled")) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    return true;
  });
}

function focusPreferredField(panel: HTMLElement) {
  const preferred =
    panel.querySelector<HTMLElement>(
      'input:not([disabled]):not([type="hidden"]):not([type="submit"]), select:not([disabled]), textarea:not([disabled])',
    ) ?? getFocusableElements(panel)[0];
  preferred?.focus();
}

export function SlideOver({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  wide,
  suspendInteractions = false,
  focusKey,
}: SlideOverProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);
  const lastFocusedKeyRef = useRef<string | number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      lastFocusedKeyRef.current = null;
      return;
    }

    const panel = panelRef.current;
    if (!panel) return;

    const unlockBody = lockBodyScroll();

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened && !suspendInteractions) {
      focusPreferredField(panel);
      if (focusKey !== undefined) {
        lastFocusedKeyRef.current = focusKey;
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (suspendInteractions) return;

      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(panel);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panel.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (active === last || !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      unlockBody();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, suspendInteractions, focusKey]);

  useEffect(() => {
    if (!open || suspendInteractions) return;
    if (focusKey === undefined) return;
    if (lastFocusedKeyRef.current === focusKey) return;
    lastFocusedKeyRef.current = focusKey;
    const panel = panelRef.current;
    if (!panel) return;
    focusPreferredField(panel);
  }, [open, focusKey, suspendInteractions]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close panel"
        className="absolute inset-0 bg-slate-900/30 transition-opacity duration-200"
        onClick={() => {
          if (!suspendInteractions) onCloseRef.current();
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        inert={suspendInteractions ? true : undefined}
        className={cn(
          "relative flex h-full w-full flex-col bg-bg-surface shadow-md transition-transform duration-200 ease-out",
          wide ? "max-w-xl" : "max-w-lg",
        )}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border-default px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-lg font-semibold tracking-tight text-text-primary"
            >
              {title}
            </h2>
            {description ? (
              <p
                id={descriptionId}
                className="mt-1 text-sm text-text-secondary"
              >
                {description}
              </p>
            ) : null}
          </div>
          <IconButton
            label="Close"
            onClick={() => onCloseRef.current()}
            disabled={suspendInteractions}
          >
            <IconClose />
          </IconButton>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer ? (
          <footer className="border-t border-border-default bg-bg-surface px-5 py-4">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
