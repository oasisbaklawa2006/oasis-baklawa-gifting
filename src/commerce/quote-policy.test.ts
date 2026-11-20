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
    const localQuote = { ...validQuote, authoritative: false };
    expect(isAuthoritativeOrderQuote(requested, localQuote)).toBe(false);
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

  it("rejects line multiplication and subtotal drift despite an authority flag", () => {
    const baseLine = validQuote.lines[0]!;
    const inconsistentQuotes: PricedCart[] = [
      {
        ...validQuote,
        lines: [{ ...baseLine, lineTotal: { amount: 199, currency: "INR" } }],
      },
      {
        ...validQuote,
        subtotal: { amount: 201, currency: "INR" },
      },
      {
        ...validQuote,
        lines: [{ ...baseLine, lineTotal: { amount: 199.995, currency: "INR" } }],
      },
      {
        ...validQuote,
        lines: [{ ...baseLine, unitPrice: { amount: 100.001, currency: "INR" } }],
      },
      {
        ...validQuote,
        total: { amount: Number.MAX_SAFE_INTEGER, currency: "INR" },
      },
    ];
    for (const quote of inconsistentQuotes) {
      expect(isAuthoritativeOrderQuote(requested, quote)).toBe(false);
    }
  });

  it("accepts exactly reconciled two-decimal fractional INR prices", () => {
    const quote: PricedCart = {
      ...validQuote,
      lines: [
        {
          ...validQuote.lines[0]!,
          unitPrice: { amount: 99.95, currency: "INR" },
          lineTotal: { amount: 199.9, currency: "INR" },
        },
      ],
      subtotal: { amount: 199.9, currency: "INR" },
      total: { amount: 199.9, currency: "INR" },
    };
    expect(isAuthoritativeOrderQuote(requested, quote)).toBe(true);
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
