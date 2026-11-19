import { describe, expect, it } from "vitest";

import { buildRobotsTxt, isAbsoluteUrl } from "@/lib/robots";

describe("robots.txt", () => {
  it("declares the sitemap as an absolute URL", () => {
    const txt = buildRobotsTxt("https://preview.example.invalid/sitemap.xml");
    expect(txt).toContain("Sitemap: https://preview.example.invalid/sitemap.xml\n");
    expect(isAbsoluteUrl("https://preview.example.invalid/sitemap.xml")).toBe(true);
    expect(isAbsoluteUrl("/sitemap.xml")).toBe(false);
  });

  it("keeps the existing crawl rules unchanged", () => {
    const txt = buildRobotsTxt("https://x.invalid/sitemap.xml");
    for (const agent of ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit"]) {
      expect(txt).toContain(`User-agent: ${agent}\nAllow: /`);
    }
    expect(txt).toContain("Disallow: /admin/");
    expect(txt).toContain("Disallow: /checkout");
    expect(txt).toContain("Disallow: /cart");
  });
});
