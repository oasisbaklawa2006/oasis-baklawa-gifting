import { describe, expect, it } from "vitest";

import { briefFromSearch, briefToSearch, eligibleProducts, recommendGifts } from "@/lib/gift-finder";

describe("gift finder", () => {
  it("never recommends unapproved placeholder records", () => {
    expect(eligibleProducts({}).every((product) => !product.isMock)).toBe(true);
  });

  it("returns a deterministic, ranked, bounded result set", () => {
    const brief = { occasion: "corporate", recipient: "client", budget: "3000-6000" } as const;
    const first = recommendGifts(brief, 4);
    const second = recommendGifts(brief, 4);
    expect(first.length).toBeLessThanOrEqual(4);
    expect(first.map((r) => r.product.id)).toEqual(second.map((r) => r.product.id));
    expect(first[0]!.score).toBeGreaterThanOrEqual(first[first.length - 1]!.score);
  });

  it("filters out products without a verified claim when one is required", () => {
    const filtered = eligibleProducts({ requiredClaims: ["definitely-not-a-real-claim"] });
    expect(filtered).toHaveLength(0);
  });

  it("round-trips brief state through URL search params", () => {
    const brief = { occasion: "festive", preference: "baklawa" } as const;
    expect(briefFromSearch(briefToSearch(brief))).toEqual(brief);
    expect(briefFromSearch({ occasion: "bogus" })).toEqual({});
  });
});
