import { describe, expect, it } from "vitest";

import { normalizePath, siteUrl } from "../site-url";

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
