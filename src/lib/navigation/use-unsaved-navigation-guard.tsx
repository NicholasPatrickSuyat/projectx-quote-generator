"use client";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  acquireHistoryIndexTracking,
  annotateCurrentEntry,
  getHistoryIndex,
} from "@/lib/navigation/history-index";
import { useRegisterUnsavedChanges } from "@/lib/navigation/unsaved-changes";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function isInternalAppHref(href: string): boolean {
  if (!href || href.startsWith("#")) return false;
  if (
    href.startsWith("mailto:") ||
    href.startsWith("tel:") ||
    href.startsWith("javascript:")
  ) {
    return false;
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin;
    } catch {
      return false;
    }
  }
  return href.startsWith("/");
}

function locationKey(url: URL = new URL(window.location.href)): string {
  return `${url.pathname}${url.search}${url.hash}` || url.pathname;
}

type PendingLeave =
  | { kind: "href"; href: string }
  | {
      kind: "history";
      href: string;
      destIndex: number;
      stayIndex: number;
    };

type UseUnsavedNavigationGuardOptions = {
  isDirty: boolean;
  /** Skip leave prompt for specific same-app navigations (e.g. Settings tabs). */
  shouldIgnoreHref?: (url: URL) => boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type UseUnsavedNavigationGuardResult = {
  allowLeave: () => void;
  requestNavigation: (href: string) => void;
  discardAndNavigate: (href: string) => void;
  leaveDialog: ReactNode;
  isLeavePromptOpen: boolean;
};

type PendingRestore = {
  destIndex: number;
  destHref: string;
};

/**
 * Dirty-navigation guard using annotated history indexes.
 * Restores position with history.go(delta) — no same-URL sentinel pushState.
 */
export function useUnsavedNavigationGuard({
  isDirty,
  shouldIgnoreHref,
  title = "Discard unsaved changes?",
  description = "You have unsaved edits. Leave this page and discard them?",
  confirmLabel = "Discard and leave",
  cancelLabel = "Keep editing",
}: UseUnsavedNavigationGuardOptions): UseUnsavedNavigationGuardResult {
  const router = useRouter();
  const allowLeaveRef = useRef(false);
  const stayUrlRef = useRef("");
  const stayIndexRef = useRef(0);
  const ignorePopRef = useRef(false);
  const pendingRestoreRef = useRef<PendingRestore | null>(null);
  const shouldIgnoreHrefRef = useRef(shouldIgnoreHref);
  const [pending, setPending] = useState<PendingLeave | null>(null);

  useEffect(() => {
    shouldIgnoreHrefRef.current = shouldIgnoreHref;
  }, [shouldIgnoreHref]);

  useRegisterUnsavedChanges(isDirty);

  // Keep stay URL/index aligned with intentional in-page URL changes (Settings tabs).
  const lastAnnotatedUrlRef = useRef("");
  useEffect(() => {
    if (!isDirty) return;
    if (pending !== null) return;
    const url = locationKey();
    if (url === lastAnnotatedUrlRef.current) return;
    lastAnnotatedUrlRef.current = url;
    stayUrlRef.current = url;
    stayIndexRef.current = annotateCurrentEntry();
  });

  useEffect(() => {
    if (isDirty) return;
    allowLeaveRef.current = false;
    ignorePopRef.current = false;
    pendingRestoreRef.current = null;
    if (pending === null) return;
    const timer = window.setTimeout(() => setPending(null), 0);
    return () => window.clearTimeout(timer);
  }, [isDirty, pending]);

  const consumeBypass = useCallback(() => {
    if (!allowLeaveRef.current) return false;
    allowLeaveRef.current = false;
    return true;
  }, []);

  const allowLeave = useCallback(() => {
    allowLeaveRef.current = true;
  }, []);

  const navigateTo = useCallback(
    (href: string) => {
      allowLeaveRef.current = false;
      setPending(null);
      router.push(href);
    },
    [router],
  );

  const discardAndNavigate = useCallback(
    (href: string) => {
      navigateTo(href);
    },
    [navigateTo],
  );

  const requestNavigation = useCallback(
    (href: string) => {
      if (!isDirty) {
        navigateTo(href);
        return;
      }
      if (consumeBypass()) {
        navigateTo(href);
        return;
      }
      setPending({ kind: "href", href });
    },
    [isDirty, consumeBypass, navigateTo],
  );

  useEffect(() => {
    if (!isDirty) {
      allowLeaveRef.current = false;
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (consumeBypass()) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, consumeBypass]);

  useEffect(() => {
    if (!isDirty) return;

    function onDocumentClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank") return;

      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || !isInternalAppHref(hrefAttr)) return;

      const url = new URL(hrefAttr, window.location.href);
      if (shouldIgnoreHrefRef.current?.(url)) return;

      const next = locationKey(url);
      const current = locationKey();
      if (next === current) return;

      if (consumeBypass()) return;

      event.preventDefault();
      event.stopPropagation();
      setPending({ kind: "href", href: next });
    }

    document.addEventListener("click", onDocumentClick, true);
    return () => document.removeEventListener("click", onDocumentClick, true);
  }, [isDirty, consumeBypass]);

  useEffect(() => {
    if (!isDirty) return;

    // Tracking is also held by AppShell; acquire here so indexes stay live if shell unmounts.
    const releaseTracking = acquireHistoryIndexTracking();
    const url = locationKey();
    lastAnnotatedUrlRef.current = url;
    stayUrlRef.current = url;
    stayIndexRef.current = annotateCurrentEntry();

    function onPopState(event: PopStateEvent) {
      // Completing history.go() restore — sync App Router, then open dialog.
      if (ignorePopRef.current) {
        ignorePopRef.current = false;
        const restore = pendingRestoreRef.current;
        pendingRestoreRef.current = null;
        if (restore) {
          router.replace(stayUrlRef.current, { scroll: false });
          setPending({
            kind: "history",
            href: restore.destHref,
            destIndex: restore.destIndex,
            stayIndex: stayIndexRef.current,
          });
        }
        return;
      }

      if (consumeBypass()) return;

      let destIndex = getHistoryIndex(event.state);
      const stayIndex = stayIndexRef.current;
      const destHref = locationKey();

      // Untagged entry (pre-tracking / external): assume one-step Back (common case).
      // Forward into an untagged entry remains a rare edge; AppShell tagging covers in-app nav.
      if (destIndex === null) {
        destIndex = stayIndex - 1;
      }

      if (destIndex === stayIndex) return;

      // Indexes are positional — delta equals browser history distance.
      const deltaToStay = stayIndex - destIndex;
      if (deltaToStay === 0) return;

      pendingRestoreRef.current = { destIndex, destHref };
      ignorePopRef.current = true;
      window.history.go(deltaToStay);
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      ignorePopRef.current = false;
      pendingRestoreRef.current = null;
      releaseTracking();
    };
  }, [isDirty, consumeBypass, router]);

  function handleCancel() {
    ignorePopRef.current = false;
    pendingRestoreRef.current = null;
    setPending(null);
    const url = locationKey();
    lastAnnotatedUrlRef.current = url;
    stayUrlRef.current = url;
    stayIndexRef.current = annotateCurrentEntry();
  }

  function handleConfirm() {
    if (!isDirty || !pending) {
      setPending(null);
      return;
    }

    const next = pending;
    setPending(null);

    if (next.kind === "href") {
      navigateTo(next.href);
      return;
    }

    const deltaToDest = next.destIndex - next.stayIndex;
    if (deltaToDest === 0) return;

    allowLeaveRef.current = true;
    window.history.go(deltaToDest);
  }

  const isLeavePromptOpen = isDirty && pending !== null;

  const leaveDialog = (
    <ConfirmDialog
      open={isLeavePromptOpen}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone="danger"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    />
  );

  return {
    allowLeave,
    requestNavigation,
    discardAndNavigate,
    leaveDialog,
    isLeavePromptOpen,
  };
}
