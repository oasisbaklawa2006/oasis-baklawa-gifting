/**
 * Single source of truth for the public site origin and URL building.
 *
 * Resolution order:
 *  1. Configured origin — `VITE_SITE_URL` (client + build) or `SITE_URL` (server runtime).
 *  2. The current request/browser origin (preview + development).
 *  3. Empty string — callers then emit root-relative URLs, which crawlers
 *     resolve against the serving host. No fake hostname is ever invented.
 */

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

/** Configured origin from env, normalized (no trailing slash). Empty when unset. */
function configuredOrigin(): string {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_SITE_URL"] as string | undefined)
      : undefined;
  const fromNode =
    typeof process !== "undefined" && process.env
      ? (process.env["SITE_URL"] ?? process.env["VITE_SITE_URL"])
      : undefined;

  const raw = (fromVite || fromNode || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return trimTrailingSlashes(url.origin);
  } catch {
    return "";
  }
}

/** Normalizes any path to a deterministic, leading-slash, no-trailing-slash path. */
export function normalizePath(path: string): string {
  if (!path || path === "/") return "/";
  const withLeading = path.startsWith("/") ? path : `/${path}`;
  const [pathname, rest] = splitQuery(withLeading);
  const cleaned = trimTrailingSlashes(pathname.replace(/\/{2,}/g, "/")) || "/";
  return `${cleaned}${rest}`;
}

function splitQuery(value: string): [string, string] {
  const index = value.search(/[?#]/);
  if (index === -1) return [value, ""];
  return [value.slice(0, index), value.slice(index)];
}

/**
 * The public site origin.
 * @param requestUrl Optional request URL (server handlers) used as a safe fallback.
 */
export function siteOrigin(requestUrl?: string): string {
  const configured = configuredOrigin();
  if (configured) return configured;

  if (requestUrl) {
    try {
      return trimTrailingSlashes(new URL(requestUrl).origin);
    } catch {
      /* ignore */
    }
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return trimTrailingSlashes(window.location.origin);
  }

  return "";
}

/**
 * Builds a URL for `path`. Fully qualified when an origin is known,
 * root-relative otherwise (never a placeholder domain).
 */
export function siteUrl(path: string, requestUrl?: string): string {
  const normalized = normalizePath(path);
  const origin = siteOrigin(requestUrl);
  return origin ? `${origin}${normalized === "/" ? "/" : normalized}` : normalized;
}

/** Canonical URL for a route path. */
export const canonicalUrl = siteUrl;
