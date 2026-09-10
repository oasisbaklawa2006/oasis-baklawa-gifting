/**
 * NATIVE COMMERCE ADAPTER
 *
 * Serves the governed catalogue snapshot that ships with the build, and hands
 * order intent to the Oasis Central / Appverse connector when one is
 * configured. With no connector configured it fails closed: the UI is told the
 * order cannot be created, rather than pretending an order was placed.
 */

import { appverse, catalogueSource } from "@/config/integrations";
import { products } from "@/data/catalog";
import type { Money } from "@/data/types";

import type {
  CartLineInput,
  CommerceProvider,
  OrderIntent,
  OrderIntentInput,
  OrderStatus,
  PricedCart,
  ProviderHealth,
} from "./types";

const money = (amount: number, currency: Money["currency"] = "INR"): Money => ({
  amount,
  currency,
});

/** Snapshot version stamped at build time from the in-repo governed data. */
export const LOCAL_SNAPSHOT_VERSION = "local-2026-09";

export const nativeProvider: CommerceProvider = {
  id: "native",

  async listProducts() {
    return products;
  },

  async getProduct(slug: string) {
    return products.find((p) => p.slug === slug) ?? null;
  },

  async priceCart(lines: CartLineInput[]): Promise<PricedCart> {
    const priced = lines.flatMap((line) => {
      const product = products.find((p) => p.id === line.productId);
      const variant = product?.variants.find((v) => v.id === line.variantId);
      if (!product || !variant) return [];
      return [
        {
          productId: line.productId,
          variantId: line.variantId,
          quantity: line.quantity,
          unitPrice: variant.price,
          lineTotal: money(variant.price.amount * line.quantity, variant.price.currency),
        },
      ];
    });

    const subtotal = money(priced.reduce((sum, l) => sum + l.lineTotal.amount, 0));

    return {
      lines: priced,
      subtotal,
      total: subtotal,
      // Local snapshot pricing is indicative until Central confirms it.
      authoritative: Boolean(appverse.baseUrl),
    };
  },

  async createOrderIntent(input: OrderIntentInput): Promise<OrderIntent> {
    if (!appverse.baseUrl) {
      return {
        status: "unavailable",
        reason:
          "Order handoff is not connected yet. Please complete your order through the enquiry form.",
      };
    }

    const response = await fetch(`${appverse.baseUrl}/v1/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-oasis-contract-version": appverse.contractVersion,
        "idempotency-key": input.idempotencyKey,
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      return { status: "unavailable", reason: `Order service responded ${response.status}.` };
    }

    const payload = (await response.json()) as {
      orderReference: string;
      total: Money;
      payment?: { provider: string; clientToken: string };
    };

    return {
      status: "created",
      orderReference: payload.orderReference,
      total: payload.total,
      ...(payload.payment ? { payment: payload.payment } : {}),
    };
  },

  async getOrderStatus(reference: string, contact: string): Promise<OrderStatus> {
    if (!appverse.baseUrl) {
      return { status: "unknown", reason: "Live order tracking is not connected yet." };
    }

    const url = new URL(`${appverse.baseUrl}/v1/orders/${encodeURIComponent(reference)}`);
    url.searchParams.set("contact", contact);

    const response = await fetch(url, {
      headers: { "x-oasis-contract-version": appverse.contractVersion },
    });
    if (!response.ok)
      return { status: "unknown", reason: `Order service responded ${response.status}.` };

    const payload = (await response.json()) as {
      orderReference: string;
      stage: string;
      placedAt: string;
      trackingUrl?: string;
      courier?: string;
    };
    return { status: "found", ...payload };
  },

  async health(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    if (!appverse.baseUrl) {
      return {
        provider: "native",
        ok: false,
        detail:
          "Serving the in-repo governed catalogue snapshot. Central connector URL not configured.",
        checkedAt,
        snapshotVersion: LOCAL_SNAPSHOT_VERSION,
      };
    }

    try {
      const response = await fetch(`${appverse.baseUrl}/v1/health`, {
        headers: { "x-oasis-contract-version": appverse.contractVersion },
      });
      const body = (await response.json().catch(() => ({}))) as { snapshotVersion?: string };
      return {
        provider: "native",
        ok: response.ok,
        detail: response.ok
          ? "Central connector reachable."
          : `Central connector responded ${response.status}.`,
        checkedAt,
        snapshotVersion: body.snapshotVersion ?? LOCAL_SNAPSHOT_VERSION,
      };
    } catch (error) {
      return {
        provider: "native",
        ok: false,
        detail: `Central connector unreachable: ${(error as Error).message}`,
        checkedAt,
      };
    }
  },
};

export const catalogueMode = catalogueSource.mode;
