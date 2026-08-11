/**
 * App-wide history index annotations for deterministic Back/Forward guarding.
 * Indexes are positional (current + 1 on push), not a monotonic high-water mark,
 * so Back → new navigation truncates the forward stack without creating gaps.
 * Uses replaceState to tag entries — does not create dirty-time sentinel pushes.
 */

const INDEX_KEY = "__qgIdx";

type IndexedState = Record<string, unknown> & { [INDEX_KEY]?: number };

let installed = false;
let refCount = 0;
/** Index of the history entry the browser is currently on. */
let currentIdx = 0;
let origPush: History["pushState"] | null = null;
let origReplace: History["replaceState"] | null = null;

function asRecord(data: unknown): IndexedState {
  if (data && typeof data === "object") {
    return { ...(data as Record<string, unknown>) };
  }
  return {};
}

export function getHistoryIndex(state: unknown): number | null {
  if (!state || typeof state !== "object") return null;
  const value = (state as IndexedState)[INDEX_KEY];
  return typeof value === "number" ? value : null;
}

function syncCurrentFromState(state: unknown): void {
  const idx = getHistoryIndex(state);
  if (idx !== null) {
    currentIdx = idx;
  }
}

function onPopState(event: PopStateEvent): void {
  syncCurrentFromState(event.state);
}

function install(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;
  origPush = history.pushState.bind(history);
  origReplace = history.replaceState.bind(history);

  const current = getHistoryIndex(history.state);
  if (current === null) {
    currentIdx = 0;
    origReplace(
      { ...asRecord(history.state), [INDEX_KEY]: currentIdx },
      "",
      location.href,
    );
  } else {
    currentIdx = current;
  }

  history.pushState = (data, unused, url) => {
    // Positional: after Back, currentIdx is lower; push reuses next slot
    // (browser truncates any forward entries).
    const nextIdx = currentIdx + 1;
    currentIdx = nextIdx;
    const next = { ...asRecord(data), [INDEX_KEY]: nextIdx };
    return origPush!(next, unused, url);
  };

  history.replaceState = (data, unused, url) => {
    const existing =
      getHistoryIndex(data) ?? getHistoryIndex(history.state) ?? currentIdx;
    currentIdx = existing;
    const next = { ...asRecord(data), [INDEX_KEY]: existing };
    return origReplace!(next, unused, url);
  };

  window.addEventListener("popstate", onPopState);
}

function uninstall(): void {
  if (!installed || !origPush || !origReplace) return;
  window.removeEventListener("popstate", onPopState);
  history.pushState = origPush;
  history.replaceState = origReplace;
  origPush = null;
  origReplace = null;
  installed = false;
}

/** Ref-counted install so AppShell + dirty guards share one patch. */
export function acquireHistoryIndexTracking(): () => void {
  refCount += 1;
  if (refCount === 1) install();
  return () => {
    refCount = Math.max(0, refCount - 1);
    if (refCount === 0) uninstall();
  };
}

/** Tag the current history entry (same positional index) with the current URL. */
export function annotateCurrentEntry(): number {
  const existing = getHistoryIndex(history.state);
  const idx = existing ?? currentIdx;
  currentIdx = idx;
  history.replaceState(
    { ...asRecord(history.state), [INDEX_KEY]: idx },
    "",
    location.href,
  );
  return idx;
}
