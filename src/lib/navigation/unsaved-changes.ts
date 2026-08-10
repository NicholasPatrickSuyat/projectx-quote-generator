"use client";

import { useEffect } from "react";

type DirtyChecker = () => boolean;

const dirtyCheckers = new Set<DirtyChecker>();

/**
 * Lightweight registry so Sign Out can reuse page-level dirty state
 * without a full shared navigation-guard architecture.
 *
 * Broader popstate / cross-route dirty guarding remains a hardening milestone.
 */
export function hasRegisteredUnsavedChanges(): boolean {
  for (const check of dirtyCheckers) {
    try {
      if (check()) return true;
    } catch {
      // Ignore a broken checker; do not block sign-out forever.
    }
  }
  return false;
}

/** Register whether the current view has unsaved edits. */
export function useRegisterUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    const check: DirtyChecker = () => isDirty;
    dirtyCheckers.add(check);
    return () => {
      dirtyCheckers.delete(check);
    };
  }, [isDirty]);
}
