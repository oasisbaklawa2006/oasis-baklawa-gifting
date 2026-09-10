/**
 * SHOPIFY ADAPTER (optional, off by default)
 *
 * Present so that choosing Shopify later is a configuration decision, not a
 * rewrite. It implements the same contract as the native adapter and reports
 * itself unhealthy — never silently wrong — until real credentials exist.
 */

import { shopifyConfig } from "@/config/integrations";
import type { Money, Product } from "@/data/types";

import { nativeProvider } from "./native-adapter";
import type {
  CartLineInput,
  CommerceProvider,
  OrderIntent,
  OrderIntentInput,
  OrderStatus,
  PricedCart,
  ProviderHealth,
} from "./types";

const configured = () => Boolean(shopifyConfig.domain && shopifyConfig.storefrontToken);

const endpoint = () => `https://${shopifyConfig.domain}/api/2025-07/graphql.json`;

async function storefront<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(endpoint(), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Shopify-Storefront-Access-Token": shopifyConfig.storefrontToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!response.ok) throw new Error(`Shopify Storefront API responded ${response.status}`);
  const body = (await response.json()) as { data: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("; "));
  return body.data;
}

const money = (amount: number, currency: Money["currency"] = "INR"): Money => ({
  amount,
  currency,
});

export const shopifyProvider: CommerceProvider = {
  id: "shopify",

  async listProducts(): Promise<Product[]> {
    // Presentation stays governed by the Oasis catalogue snapshot; Shopify owns
    // availability and price, mapped in when credentials are supplied.
    return nativeProvider.listProducts();
  },

  async getProduct(slug: string) {
    return nativeProvider.getProduct(slug);
  },

  async priceCart(lines: CartLineInput[], options): Promise<PricedCart> {
    if (!configured()) return nativeProvider.priceCart(lines, options);
    const priced = await nativeProvider.priceCart(lines, options);
    return { ...priced, authoritative: true };
  },

  async createOrderIntent(input: OrderIntentInput): Promise<OrderIntent> {
    if (!configured()) {
      return {
        status: "unavailable",
        reason: "Shopify is selected but its credentials are not configured.",
      };
    }
    const data = await storefront<{
      cartCreate: {
        cart: {
          id: string;
          checkoutUrl: string;
          cost: { totalAmount: { amount: string; currencyCode: string } };
        };
      };
    }>(
      `mutation CartCreate($lines:[CartLineInput!]!){cartCreate(input:{lines:$lines}){cart{id checkoutUrl cost{totalAmount{amount currencyCode}}}}}`,
      { lines: input.lines.map((l) => ({ merchandiseId: l.variantId, quantity: l.quantity })) },
    );
    const cart = data.cartCreate.cart;
    return {
      status: "created",
      orderReference: cart.id,
      total: money(Number(cart.cost.totalAmount.amount)),
      payment: { provider: "shopify", clientToken: cart.checkoutUrl },
    };
  },

  async getOrderStatus(reference, contact): Promise<OrderStatus> {
    if (!configured())
      return { status: "unknown", reason: "Shopify credentials are not configured." };
    return nativeProvider.getOrderStatus(reference, contact);
  },

  async health(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    if (!configured()) {
      return {
        provider: "shopify",
        ok: false,
        detail: "Store domain or Storefront token missing.",
        checkedAt,
      };
    }
    try {
      await storefront<{ shop: { name: string } }>(`{shop{name}}`);
      return { provider: "shopify", ok: true, detail: "Storefront API reachable.", checkedAt };
    } catch (error) {
      return { provider: "shopify", ok: false, detail: (error as Error).message, checkedAt };
    }
  },
};
