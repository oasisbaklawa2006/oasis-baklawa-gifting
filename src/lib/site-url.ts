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

/** Parses a raw origin/host string into a bare origin (no trailing slash); empty when invalid. */
function parseOrigin(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    if (!["https:", "http:"].includes(url.protocol) || url.origin === "null") return "";
    return trimTrailingSlashes(url.origin);
  } catch {
    return "";
  }
}

/** Origin baked in at BUILD time (`VITE_SITE_URL`). Identical in the server and client bundles. */
function buildTimeOrigin(): string {
  const fromVite =
    typeof import.meta !== "undefined" && import.meta.env
      ? (import.meta.env["VITE_SITE_URL"] as string | undefined)
      : undefined;
  return parseOrigin(fromVite ?? "");
}

/** Configured origin from env, normalized (no trailing slash). Empty when unset. */
function configuredOrigin(): string {
  const fromNode =
    typeof process !== "undefined" && process.env
      ? (process.env["SITE_URL"] ?? process.env["VITE_SITE_URL"])
      : undefined;
  return buildTimeOrigin() || parseOrigin(fromNode ?? "");
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

/**
 * Personal routes and unapproved product fixtures are intentionally noindex.
 * Do not publish their paths as canonical URLs from the root head. A real
 * approved Core product publication must establish its own SEO release gate.
 */
const nonCanonicalPaths = new Set([
  "/account",
  "/admin/status",
  "/cart",
  "/checkout",
  "/restore-cart",
  "/search",
  "/track-order",
  "/wishlist",
]);

function isNonCanonicalRoute(path: string): boolean {
  return nonCanonicalPaths.has(path) || path.startsWith("/order/") || path.startsWith("/product/");
}

/**
 * Canonical `<link>` entries for a route, or NONE.
 *
 * A canonical is emitted only when an approved origin is baked in at build time (`VITE_SITE_URL`):
 *  - The server and client bundles then compute the identical absolute URL, so the router replaces the
 *    tag on navigation. Without that, the server rendered a root-relative href and the browser added a
 *    second absolute one, leaving two canonicals in the live DOM, the first stale after any navigation.
 *  - Deriving it from the request host would declare preview hosts (`*.vercel.app`, `*.netlify.app`)
 *    canonical, and a root-relative canonical is not what crawlers are told to expect.
 * Query strings and fragments are excluded.
 */
export function canonicalLinks(path: string): { rel: "canonical"; href: string }[] {
  const origin = buildTimeOrigin();
  if (!origin) return [];
  const pathname = normalizePath(path).split(/[?#]/)[0] || "/";
  if (isNonCanonicalRoute(pathname)) return [];
  return [{ rel: "canonical", href: `${origin}${pathname}` }];
}
