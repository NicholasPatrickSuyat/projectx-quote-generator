/**
 * Lightweight server-boundary guard without an extra dependency.
 * Throws if evaluated in a browser runtime.
 */
export function assertServerModule(moduleLabel: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${moduleLabel} is server-only and must not be imported into Client Components.`,
    );
  }
}
