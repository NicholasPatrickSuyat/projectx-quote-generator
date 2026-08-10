/**
 * Validates post-login `next` redirect targets.
 * Only safe internal app paths are allowed.
 */

const LOGIN_PATH = "/login";

/**
 * Returns a safe in-app path (with optional query string), or `/` when invalid.
 *
 * Allowed: `/quotes`, `/quotes?status=Draft`
 * Rejected: `/login`, `//evil.com`, `https://evil.com`, absolute URLs
 */
export function sanitizeNextPath(raw: string | null | undefined): string {
  if (raw == null) return "/";
  const value = raw.trim();
  if (!value) return "/";

  // Absolute URLs (http:, https:, javascript:, etc.)
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return "/";

  // Must start with exactly one slash (rejects //host and missing /)
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  // Reject backslash / mixed tricks some browsers normalize
  if (value.includes("\\")) return "/";

  const hashIndex = value.indexOf("#");
  const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;

  const queryIndex = withoutHash.indexOf("?");
  const pathname =
    queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const search = queryIndex >= 0 ? withoutHash.slice(queryIndex) : "";

  if (!pathname.startsWith("/") || pathname.startsWith("//")) return "/";
  if (pathname.includes("//")) return "/";

  const normalized = pathname.length === 0 ? "/" : pathname;
  if (
    normalized === LOGIN_PATH ||
    normalized.startsWith(`${LOGIN_PATH}/`)
  ) {
    return "/";
  }

  return `${normalized}${search}`;
}
