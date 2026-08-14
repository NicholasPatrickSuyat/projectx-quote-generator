/**
 * Trusted client IP extraction for login rate limiting (M20).
 *
 * Trust rules:
 * - On Vercel (`VERCEL=1` or `VERCEL_ENV` set): use platform forwarding headers.
 * - Local `APP_ENV=development`: allow the same headers for tests only.
 * - Otherwise: return null (email-dimension enforcement only).
 *
 * Never trust arbitrary client-supplied forwarding headers on unknown hosts.
 */

export function isTrustedIpEnvironment(): boolean {
  if (process.env.VERCEL === "1") return true;
  const vercelEnv = (process.env.VERCEL_ENV ?? "").trim().toLowerCase();
  if (vercelEnv === "production" || vercelEnv === "preview" || vercelEnv === "development") {
    return true;
  }
  const appEnv = (process.env.APP_ENV ?? "").trim().toLowerCase();
  return appEnv === "development";
}

/**
 * Returns a canonical IPv4/IPv6 string or null when IP enforcement must be skipped.
 */
export function extractTrustedClientIp(request: Request | undefined): string | null {
  if (!request || !isTrustedIpEnvironment()) {
    return null;
  }

  const headers = request.headers;
  const vercelForwarded = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercelForwarded) {
    const first = vercelForwarded.split(",")[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }

  const forwarded = headers.get("x-forwarded-for")?.trim();
  if (forwarded) {
    // Leftmost = original client when the platform appends proxies to the right.
    const first = forwarded.split(",")[0]?.trim();
    if (first && isPlausibleIp(first)) return first;
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp && isPlausibleIp(realIp)) return realIp;

  return null;
}

function isPlausibleIp(value: string): boolean {
  // Basic guard against header injection / empty tokens — not a full IP parser.
  if (!value || value.length > 64) return false;
  if (/\s/.test(value)) return false;
  if (value.includes("/")) return false;
  return /^[0-9a-fA-F:.]+$/.test(value);
}
