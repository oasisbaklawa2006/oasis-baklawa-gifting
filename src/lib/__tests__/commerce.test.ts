import { describe, expect, it } from "vitest";

import { nativeProvider } from "@/commerce/native-adapter";
import { products } from "@/data/catalog";

describe("native commerce adapter", () => {
  it("prices a cart from the governed snapshot", async () => {
    const product = products[0]!;
    const variant = product.variants[0]!;
    const priced = await nativeProvider.priceCart([
      { productId: product.id, variantId: variant.id, quantity: 3 },
    ]);
    expect(priced.subtotal.amount).toBe(variant.price.amount * 3);
    expect(priced.total.amount).toBe(priced.subtotal.amount);
  });

  it("ignores unknown lines instead of inventing a price", async () => {
    const priced = await nativeProvider.priceCart([
      { productId: "nope", variantId: "nope", quantity: 1 },
    ]);
    expect(priced.lines).toHaveLength(0);
    expect(priced.subtotal.amount).toBe(0);
  });

  it("fails closed on order creation when no connector is configured", async () => {
    const result = await nativeProvider.createOrderIntent({
      lines: [{ productId: "x", variantId: "y", quantity: 1 }],
      contact: { name: "A", email: "a@example.com", phone: "9876543210" },
      shipping: { addressLine1: "1", city: "Delhi", pincode: "110016", country: "IN" },
      idempotencyKey: "test-key-123456",
    });
    expect(result.status).toBe("unavailable");
  });

  it("reports its own health honestly", async () => {
    const health = await nativeProvider.health();
    expect(health.provider).toBe("native");
    expect(typeof health.detail).toBe("string");
  });
});
