/**
 * COMMERCE PROVIDER CONTRACT
 *
 * The storefront talks only to this interface. A native/direct backend fulfils
 * it today; a Shopify (or any headless) adapter can fulfil it later without a
 * single presentation change. Nothing in the UI may import a provider directly.
 */

import type { Money, Product } from "@/data/types";

export type ProviderHealth = {
  provider: string;
  ok: boolean;
  /** Human-readable reason when not ok — never contains secrets. */
  detail: string;
  checkedAt: string;
  /** Catalogue snapshot version currently served, when known. */
  snapshotVersion?: string;
};

export type CartLineInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type GiftInput = {
  message?: string | undefined;
  ribbonId?: string | undefined;
  sealId?: string | undefined;
  concealInvoice?: boolean | undefined;
};

export type PricedCart = {
  lines: {
    productId: string;
    variantId: string;
    quantity: number;
    unitPrice: Money;
    lineTotal: Money;
  }[];
  subtotal: Money;
  /** Delivery and personalisation are priced by the provider, never the browser. */
  delivery?: Money;
  personalisation?: Money;
  total: Money;
  /** True when totals came from an authoritative source rather than a local snapshot. */
  authoritative: boolean;
};

export type OrderIntentInput = {
  lines: CartLineInput[];
  gift?: GiftInput;
  deliveryOptionId?: string;
  contact: { name: string; email: string; phone: string };
  shipping: { addressLine1: string; addressLine2?: string | undefined; city: string; state?: string | undefined; pincode: string; country: string };
  /** Client-generated key so a retried submit never creates a second order. */
  idempotencyKey: string;
};

export type OrderIntent =
  | { status: "created"; orderReference: string; total: Money; payment?: { provider: string; clientToken: string } }
  | { status: "unavailable"; reason: string };

export type OrderStatus =
  | { status: "unknown"; reason: string }
  | {
      status: "found";
      orderReference: string;
      stage: string;
      placedAt: string;
      trackingUrl?: string;
      courier?: string;
    };

export interface CommerceProvider {
  readonly id: string;
  /** Public-safe, approved products only. */
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  /** Authoritative pricing for a cart. Never trust browser-side totals. */
  priceCart(lines: CartLineInput[], options?: { deliveryOptionId?: string }): Promise<PricedCart>;
  /** Idempotent order handoff to the system of record. */
  createOrderIntent(input: OrderIntentInput): Promise<OrderIntent>;
  getOrderStatus(reference: string, contact: string): Promise<OrderStatus>;
  health(): Promise<ProviderHealth>;
}
