import { describe, expect, it } from "vitest";

import { nativeProvider } from "./native-adapter";
import { shopifyProvider } from "./shopify-adapter";
import { isAuthoritativeOrderQuote } from "./quote-policy";
import type { CartLineInput, PricedCart } from "./types";
import { products } from "@/data/catalog";

const requested: CartLineInput[] = [{ productId: "p1", variantId: "v1", quantity: 2 }];
const validQuote: PricedCart = {
  authoritative: true,
  lines: [
    {
      productId: "p1",
      variantId: "v1",
      quantity: 2,
      unitPrice: { amount: 100, currency: "INR" },
      lineTotal: { amount: 200, currency: "INR" },
    },
  ],
  subtotal: { amount: 200, currency: "INR" },
  total: { amount: 200, currency: "INR" },
};

describe("governed commerce quote policy", () => {
  it("rejects local and unverified pricing regardless of a connector URL", () => {
    expect(
      isAuthoritativeOrderQuote(requested, { ...validQuote, authoritative: false }),
    ).toBe(false);
  });

  it("accepts an explicitly authoritative complete quote", () => {
    expect(isAuthoritativeOrderQuote(requested, validQuote)).toBe(true);
  });

  it("rejects missing lines, quantity mismatches, duplicate lines and bad money", () => {
    expect(isAuthoritativeOrderQuote(requested, { ...validQuote, lines: [] })).toBe(false);
    expect(
      isAuthoritativeOrderQuote(requested, {
        ...validQuote,
        lines: [{ ...validQuote.lines[0]!, quantity: 3 }],
      }),
    ).toBe(false);
    expect(
      isAuthoritativeOrderQuote([...requested, ...requested], {
        ...validQuote,
        lines: [...validQuote.lines, ...validQuote.lines],
      }),
    ).toBe(false);
    expect(
      isAuthoritativeOrderQuote(requested, {
        ...validQuote,
        total: { amount: Number.NaN, currency: "INR" },
      }),
    ).toBe(false);
  });

  it("does not upgrade a native snapshot or Shopify's unverified local subtotal", async () => {
    const product = products.find((candidate) => candidate.variants.length > 0);
    expect(product).toBeDefined();
    const line = {
      productId: product!.id,
      variantId: product!.variants[0]!.id,
      quantity: 1,
    };
    const native = await nativeProvider.priceCart([line]);
    const shopify = await shopifyProvider.priceCart([line]);
    expect(native.lines).toHaveLength(1);
    expect(shopify.lines).toHaveLength(1);
    expect(native.authoritative).toBe(false);
    expect(shopify.authoritative).toBe(false);
    expect(isAuthoritativeOrderQuote([line], native)).toBe(false);
    expect(isAuthoritativeOrderQuote([line], shopify)).toBe(false);
  });
});
