import { afterEach, describe, expect, it, vi } from "vitest";

import { canonicalLinks, normalizePath, siteUrl } from "../site-url";

describe("normalizePath", () => {
  it("keeps the root path", () => {
    expect(normalizePath("/")).toBe("/");
  });

  it("adds a leading slash and strips trailing slashes", () => {
    expect(normalizePath("shop/")).toBe("/shop");
  });

  it("collapses duplicate slashes and preserves the query", () => {
    expect(normalizePath("/search//results/?q=baklawa")).toBe("/search/results?q=baklawa");
  });
});

describe("siteUrl", () => {
  it("falls back to a root-relative path rather than inventing a domain", () => {
    expect(siteUrl("/about")).toBe("/about");
  });

  it("uses the request origin when one is supplied", () => {
    expect(siteUrl("/about/", "https://example.test/anything")).toBe("https://example.test/about");
  });
});

describe("canonicalLinks", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("emits no canonical when no approved origin is configured at build time", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    expect(canonicalLinks("/about")).toEqual([]);
  });

  it("never derives a canonical from a runtime-only SITE_URL (the client bundle cannot see it)", () => {
    vi.stubEnv("VITE_SITE_URL", "");
    vi.stubEnv("SITE_URL", "https://runtime-only.example.invalid");
    expect(canonicalLinks("/about")).toEqual([]);
  });

  it("emits exactly one absolute canonical on the approved origin", () => {
    vi.stubEnv("VITE_SITE_URL", "https://approved.example.invalid/");
    expect(canonicalLinks("/about")).toEqual([
      { rel: "canonical", href: "https://approved.example.invalid/about" },
    ]);
  });

  it("normalises the path and excludes query strings and fragments", () => {
    vi.stubEnv("VITE_SITE_URL", "https://approved.example.invalid");
    expect(canonicalLinks("/shop//?q=baklawa#top")[0]?.href).toBe(
      "https://approved.example.invalid/shop",
    );
    expect(canonicalLinks("/")[0]?.href).toBe("https://approved.example.invalid/");
    expect(canonicalLinks("product/assorted-baklawa/")[0]?.href).toBe(
      "https://approved.example.invalid/product/assorted-baklawa",
    );
  });

  it("ignores an unparseable origin instead of emitting a broken canonical", () => {
    vi.stubEnv("VITE_SITE_URL", "http://");
    expect(canonicalLinks("/about")).toEqual([]);
  });

  it("rejects non-HTTP origins instead of generating a null canonical", () => {
    vi.stubEnv("VITE_SITE_URL", "file:///tmp/site");
    expect(canonicalLinks("/about")).toEqual([]);
  });

  it("does not generate canonicals for personal, noindex or unapproved product routes", () => {
    vi.stubEnv("VITE_SITE_URL", "https://approved.example.invalid");
    for (const route of [
      "/account",
      "/admin/status",
      "/cart",
      "/checkout",
      "/restore-cart?token=synthetic-private-token",
      "/search?q=synthetic-query",
      "/track-order",
      "/wishlist",
      "/order/SYNTHETIC-PRIVATE-REFERENCE",
      "/order/SYNTHETIC-PRIVATE-REFERENCE/",
      "/product/unapproved-fixture",
    ]) {
      expect(canonicalLinks(route)).toEqual([]);
    }
    expect(canonicalLinks("/shop")).toEqual([
      { rel: "canonical", href: "https://approved.example.invalid/shop" },
    ]);
    expect(canonicalLinks("/collections/signature")).toEqual([
      { rel: "canonical", href: "https://approved.example.invalid/collections/signature" },
    ]);
  });
});
