/**
 * Ref-counted document.body overflow lock for stacked overlays
 * (SlideOver + ConfirmDialog) so unlock order cannot leak scroll lock.
 */

let locks = 0;
let previousOverflow = "";

export function lockBodyScroll(): () => void {
  if (typeof document === "undefined") return () => {};

  if (locks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  locks += 1;

  return () => {
    locks = Math.max(0, locks - 1);
    if (locks === 0) {
      document.body.style.overflow = previousOverflow;
      previousOverflow = "";
    }
  };
}
