/**
 * CANONICAL COMMERCE EVENT MODEL
 *
 * One vocabulary and one payload shape for the whole storefront. Every channel
 * (GA4, GTM, Meta, Klaviyo, Pinterest, Appverse) maps FROM this model — no
 * business logic is duplicated per provider.
 */

import { z } from "zod";

import type { AttributionSnapshot } from "./attribution";

export const EVENT_NAMES = [
  // Journey
  "page_view",
  "view_item_list",
  "select_item",
  "view_item",
  "search",
  // Cart & checkout
  "add_to_wishlist",
  "add_to_cart",
  "remove_from_cart",
  "view_cart",
  "begin_checkout",
  "add_shipping_info",
  "add_payment_info",
  "purchase",
  "refund",
  "cart_abandoned",
  "checkout_abandoned",
  "cart_restored",
  "order_delivered",
  // Identity & leads
  "sign_up",
  "login",
  "lead",
  "corporate_gifting_lead",
  "wedding_gifting_lead",
  "rewards_interest",
  "newsletter_signup",
  // Gifting tools
  "gift_finder_started",
  "gift_finder_completed",
  "build_box_started",
  "build_box_completed",
  "gift_configured",
  "recipient_import",
  // Service & local
  "track_order",
  "store_view",
  "directions_click",
  "call_click",
  "contact",
  "delivery_check",
  "outbound_click",
  "share",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const itemSchema = z.object({
  item_id: z.string().min(1),
  item_name: z.string().min(1),
  item_category: z.string().optional(),
  item_variant: z.string().optional(),
  item_brand: z.string().optional(),
  price: z.number().nonnegative().optional(),
  quantity: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
});

export type AnalyticsItem = z.infer<typeof itemSchema>;

export const canonicalEventSchema = z.object({
  /** Stable id shared between browser and server dispatch (Meta CAPI dedupe). */
  eventId: z.string().min(8),
  name: z.enum(EVENT_NAMES),
  timestamp: z.string().min(10),
  clientId: z.string().min(6),
  sessionId: z.string().min(6),
  /** Only present when the customer is known AND consent allows identification. */
  customerId: z.string().optional(),
  consent: z.object({
    analytics: z.boolean(),
    marketing: z.boolean(),
    decidedAt: z.string().nullable(),
  }),
  route: z.string().min(1),
  currency: z.string().length(3).optional(),
  value: z.number().nonnegative().optional(),
  items: z.array(itemSchema).optional(),
  orderReference: z.string().optional(),
  attribution: z.record(z.string(), z.string()).optional(),
  /** Event-specific, non-identifying detail. */
  params: z.record(z.string(), z.unknown()).optional(),
});

export type CanonicalEvent = z.infer<typeof canonicalEventSchema>;

/** What callers pass to `track()` — everything else is enriched centrally. */
export type TrackInput = {
  name: EventName;
  params?: Record<string, unknown>;
  currency?: string;
  value?: number;
  items?: AnalyticsItem[];
  orderReference?: string;
  /** Supply to reuse an existing event id (server/browser dedupe). */
  eventId?: string;
};

const KEYS_NEVER_SENT = ["email", "phone", "password", "name", "address", "gstin"];

/** Strips anything that looks like PII from browser-bound event params. */
export function scrubParams(
  params: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    const lower = key.toLowerCase();
    if (KEYS_NEVER_SENT.some((banned) => lower.includes(banned))) continue;
    out[key] = value;
  }
  return Object.keys(out).length ? out : undefined;
}

export function newEventId(): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === "function") {
    return globalCrypto.randomUUID();
  }
  return `evt_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export type BuildContext = {
  clientId: string;
  sessionId: string;
  route: string;
  consent: { analytics: boolean; marketing: boolean; decidedAt: string | null };
  attribution?: AttributionSnapshot;
  attributionFields?: Record<string, string>;
  customerId?: string;
  now?: Date;
};

/** Pure builder — used by the dispatcher and directly in tests. */
export function buildEvent(input: TrackInput, ctx: BuildContext): CanonicalEvent {
  const event: CanonicalEvent = {
    eventId: input.eventId ?? newEventId(),
    name: input.name,
    timestamp: (ctx.now ?? new Date()).toISOString(),
    clientId: ctx.clientId,
    sessionId: ctx.sessionId,
    consent: ctx.consent,
    route: ctx.route,
  };
  if (ctx.customerId) event.customerId = ctx.customerId;
  if (input.currency) event.currency = input.currency;
  if (typeof input.value === "number") event.value = input.value;
  if (input.items?.length) event.items = input.items;
  if (input.orderReference) event.orderReference = input.orderReference;
  if (ctx.attributionFields && Object.keys(ctx.attributionFields).length) {
    event.attribution = ctx.attributionFields;
  }
  const params = scrubParams(input.params);
  if (params) event.params = params;
  return event;
}

/** Items derived only from authoritative cart/order data. */
export function itemsValue(items: AnalyticsItem[] | undefined): number {
  if (!items?.length) return 0;
  return items.reduce((sum, item) => sum + (item.price ?? 0) * (item.quantity ?? 1), 0);
}
