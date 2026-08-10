export type PdfDeliveryResult = {
  opened: boolean;
  objectUrl: string;
  fileName: string;
};

function triggerDownload(objectUrl: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Open a blank tab synchronously inside a user gesture. */
export function openPdfPlaceholderTab(): Window | null {
  try {
    const tab = window.open("about:blank", "_blank");
    if (!tab || tab.closed) return null;
    return tab;
  } catch {
    return null;
  }
}

export function revokePdfObjectUrl(objectUrl: string | null | undefined) {
  if (!objectUrl) return;
  try {
    URL.revokeObjectURL(objectUrl);
  } catch {
    // ignore
  }
}

/**
 * Deliver a generated PDF into a pre-opened tab, or download if the tab is unavailable.
 * Caller owns object-URL lifetime (revoke on next generate / dismiss when safe).
 */
export function deliverPdfBlob(
  blob: Blob,
  fileName: string,
  placeholderTab: Window | null,
): PdfDeliveryResult {
  const objectUrl = URL.createObjectURL(blob);
  let opened = false;

  if (placeholderTab && !placeholderTab.closed) {
    try {
      placeholderTab.location.href = objectUrl;
      opened = !placeholderTab.closed;
    } catch {
      opened = false;
    }
  }

  if (!opened) {
    try {
      placeholderTab?.close();
    } catch {
      // ignore
    }
    triggerDownload(objectUrl, fileName);
  }

  return { opened, objectUrl, fileName };
}

export function downloadFromObjectUrl(objectUrl: string, fileName: string) {
  triggerDownload(objectUrl, fileName);
}
