import { describe, expect, it } from "vitest";

import { allows, consentDecided, defaultConsent, parseConsent } from "@/lib/marketing/consent";
import {
  approvedAttributionFields,
  emptyAttribution,
  mergeAttribution,
  parseTouch,
} from "@/lib/marketing/attribution";
import { metaPayload, ga4Payload, klaviyoPayload } from "@/lib/marketing/providers";
import { buildFeed, feedDiagnostics, feedToTsv, feedToXml } from "@/lib/merchant-feed";
import { products } from "@/data/catalog";

describe("consent", () => {
  it("blocks analytics and marketing until a decision is recorded", () => {
    expect(consentDecided(defaultConsent)).toBe(false);
    expect(allows(defaultConsent, "analytics")).toBe(false);
    expect(allows(defaultConsent, "marketing")).toBe(false);
    expect(allows(defaultConsent, "necessary")).toBe(true);
  });

  it("honours a recorded partial decision", () => {
    const state = { ...defaultConsent, analytics: true, decidedAt: new Date().toISOString() };
    expect(allows(state, "analytics")).toBe(true);
    expect(allows(state, "marketing")).toBe(false);
  });

  it("falls back safely on unreadable storage", () => {
    expect(parseConsent("not json").marketing).toBe(false);
  });
});

describe("attribution", () => {
  it("captures campaign parameters and click ids", () => {
    const touch = parseTouch(
      "https://example.com/baklawa?utm_source=google&utm_medium=cpc&gclid=abc123",
      "https://www.google.com/",
    );
    expect(touch?.utmSource).toBe("google");
    expect(touch?.gclid).toBe("abc123");
  });

  it("returns null when there is no campaign signal", () => {
    expect(parseTouch("https://example.com/baklawa", "")).toBeNull();
  });

  it("keeps first touch stable while last touch updates", () => {
    const first = parseTouch("https://example.com/?utm_source=klaviyo", "")!;
    const second = parseTouch("https://example.com/?utm_source=meta", "")!;
    const merged = mergeAttribution(mergeAttribution(emptyAttribution, first), second);
    expect(merged.firstTouch?.utmSource).toBe("klaviyo");
    expect(merged.lastTouch?.utmSource).toBe("meta");
  });

  it("never exports personal fields", () => {
    const merged = mergeAttribution(
      emptyAttribution,
      parseTouch("https://example.com/?utm_source=google", "")!,
    );
    const fields = approvedAttributionFields(merged);
    const keys = Object.keys(fields).join(" ").toLowerCase();
    expect(keys).not.toMatch(/email|phone|name|address/);
  });
});

describe("provider payloads", () => {
  const event = {
    name: "add_to_cart",
    id: "evt-1",
    at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    properties: {
      currency: "INR",
      value: 1200,
      items: [{ item_id: "v1", item_name: "Baklawa", price: 1200, quantity: 1 }],
    },
  } as never;

  it("maps to each provider without leaking raw identity", () => {
    for (const payload of [ga4Payload(event), metaPayload(event), klaviyoPayload(event)]) {
      const serialized = JSON.stringify(payload).toLowerCase();
      expect(serialized).not.toContain("@");
      expect(serialized).toContain("1200");
    }
  });
});

describe("merchant feed", () => {
  it("excludes unverified placeholder products", () => {
    const feed = buildFeed().items;
    const ids = new Set(feed.map((item) => item.id));
    for (const product of products.filter((p) => p.isMock)) {
      for (const variant of product.variants) expect(ids.has(variant.id)).toBe(false);
    }
  });

  it("reports diagnostics that account for every excluded record", () => {
    const diagnostics = feedDiagnostics();
    expect(diagnostics.eligible).toBe(buildFeed().items.length);
    expect(diagnostics.excluded).toBeGreaterThanOrEqual(0);
  });

  it("renders escaped XML and tab-separated rows", () => {
    const feed = buildFeed().items;
    const xml = feedToXml(feed);
    expect(xml.startsWith("<?xml")).toBe(true);
    expect(xml).not.toMatch(/<g:title>[^<]*&(?!amp;|lt;|gt;|quot;|#)/);
    const tsv = feedToTsv(feed);
    expect(tsv.split("\n")[0]).toContain("\t");
  });
});
