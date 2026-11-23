import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { resolveWixLegacyRedirect } from "./wix-legacy-redirects";

type Row = { from: string; to: string | null; status: string; note: string };

const rows = JSON.parse(
  readFileSync(join(process.cwd(), "docs/website/wix-legacy-redirect-map.json"), "utf8"),
) as Row[];

const REDIRECTING = new Set([
  "MAPPED",
  "OVERRIDE",
  "EXACT",
  "KEYWORD",
  "CATCH_ALL",
  "PREFIX_MAPPED",
]);
const NON_REDIRECTING = new Set(["SAME_PATH", "KEPT_LIVE", "PENDING_CONFIRMATION"]);

/** Concrete request path for a documented source (`{title}` is a template placeholder). */
const concrete = (from: string) => from.replace("{title}", "sample-title");

/** Live Gifting routes derived from src/routes file names (TanStack file-based routing). */
function liveRoutePatterns(): RegExp[] {
  const dir = join(process.cwd(), "src/routes");
  const files = readdirSync(dir).filter((f) => /\.(tsx|ts)$/.test(f) && !f.startsWith("__"));
  const patterns: RegExp[] = [];
  for (const file of files) {
    const base = file.replace(/\.(tsx|ts)$/, "");
    const segments = base.split(".").filter((s) => s !== "index" && s !== "");
    const path =
      "/" + segments.map((s) => (s.startsWith("$") ? "[^/]+" : s.replace(/\[|\]/g, ""))).join("/");
    patterns.push(new RegExp("^" + (segments.length ? path : "/") + "$"));
  }
  // Root index route is "/".
  if (!patterns.some((p) => p.test("/"))) patterns.push(/^\/$/);
  return patterns;
}

const routes = liveRoutePatterns();
const isLiveRoute = (path: string) => routes.some((p) => p.test(path));

describe("Wix legacy redirect map (docs/website/wix-legacy-redirect-map.json)", () => {
  it("covers all 159 audited legacy rows exactly once", () => {
    expect(rows).toHaveLength(159);
    expect(new Set(rows.map((r) => r.from)).size).toBe(159);
  });

  it("has no unmapped rows and only known statuses", () => {
    const known = new Set([...REDIRECTING, ...NON_REDIRECTING]);
    for (const row of rows) expect(known.has(row.status), row.from).toBe(true);
  });

  it.each(rows.filter((r) => REDIRECTING.has(r.status)).map((r) => [r.from, r.to] as const))(
    "redirects %s -> %s",
    (from, to) => {
      expect(resolveWixLegacyRedirect(concrete(from))).toBe(to);
    },
  );

  it.each(rows.filter((r) => NON_REDIRECTING.has(r.status)).map((r) => [r.from] as const))(
    "does not redirect %s",
    (from) => {
      expect(resolveWixLegacyRedirect(concrete(from))).toBeNull();
    },
  );

  it("never redirects a path that is a live Gifting route (no collisions)", () => {
    for (const row of rows.filter((r) => REDIRECTING.has(r.status))) {
      expect(isLiveRoute(concrete(row.from)), row.from).toBe(false);
    }
  });

  it("every redirect target is a live route", () => {
    for (const row of rows.filter((r) => REDIRECTING.has(r.status))) {
      expect(row.to, row.from).not.toBeNull();
      expect(isLiveRoute(row.to as string), `${row.from} -> ${row.to}`).toBe(true);
    }
  });

  it("has no redirect loops or chains (targets are never redirected again)", () => {
    for (const row of rows.filter((r) => REDIRECTING.has(r.status))) {
      expect(row.to, row.from).not.toBe(concrete(row.from));
      expect(resolveWixLegacyRedirect(row.to as string), `${row.from} -> ${row.to}`).toBeNull();
    }
  });
});

describe("resolveWixLegacyRedirect rules", () => {
  it("keeps /gifting live (not redirected)", () => {
    expect(resolveWixLegacyRedirect("/gifting")).toBeNull();
  });

  it("applies the keyword rules before the product catch-all", () => {
    expect(resolveWixLegacyRedirect("/product-page/some-baklawa-box")).toBe("/baklawa");
    expect(resolveWixLegacyRedirect("/product-page/baklava-tray")).toBe("/baklawa");
    expect(resolveWixLegacyRedirect("/product-page/some-hamper")).toBe("/luxury-gifts");
    expect(resolveWixLegacyRedirect("/product-page/gift-set-2")).toBe("/luxury-gifts");
  });

  it("sends unmatched product pages to /shop and the exact product to its route", () => {
    expect(resolveWixLegacyRedirect("/product-page/a-1")).toBe("/shop");
    expect(
      resolveWixLegacyRedirect("/product-page/assorted-baklawa-with-rosello-collection-box"),
    ).toBe("/product/rosello-25");
  });

  it("does not redirect the bare product-page index", () => {
    expect(resolveWixLegacyRedirect("/product-page/")).toBeNull();
  });

  it("drops the quick-shop template segment and requires one segment", () => {
    expect(resolveWixLegacyRedirect("/quick-shop/anything")).toBe("/shop");
    expect(resolveWixLegacyRedirect("/quick-shop/")).toBeNull();
    expect(resolveWixLegacyRedirect("/quick-shop/a/b")).toBeNull();
  });

  it("ignores a single trailing slash on mapped paths", () => {
    expect(resolveWixLegacyRedirect("/questions/")).toBe("/faq");
  });

  it("returns null for unrelated paths", () => {
    expect(resolveWixLegacyRedirect("/shop")).toBeNull();
    expect(resolveWixLegacyRedirect("/")).toBeNull();
    expect(resolveWixLegacyRedirect("/not-a-wix-page")).toBeNull();
  });
});
