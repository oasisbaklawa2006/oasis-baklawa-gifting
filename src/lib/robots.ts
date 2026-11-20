/**
 * robots.txt builder.
 *
 * The Sitemaps protocol requires an ABSOLUTE URL in the `Sitemap:` line; a root-relative one is
 * ignored by crawlers, so discovery silently fails. The origin comes from the request (or configured
 * site origin), never a hard-coded domain, because the production domain is not final.
 */
export function buildRobotsTxt(sitemapUrl: string): string {
  const open = ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit"]
    .map((agent) => `User-agent: ${agent}\nAllow: /`)
    .join("\n\n");
  return [
    open,
    "",
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin/",
    "Disallow: /checkout",
    "Disallow: /cart",
    "",
    `Sitemap: ${sitemapUrl}`,
    "",
  ].join("\n");
}

/** True only for an absolute http(s) URL. */
export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\/[^\s/]+/i.test(value);
}
