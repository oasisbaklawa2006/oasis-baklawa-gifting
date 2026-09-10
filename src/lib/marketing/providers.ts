/**
 * PROVIDER ADAPTERS (browser)
 *
 * Each adapter maps the canonical event to one destination. Adapters are pure
 * mappers plus a send call: they hold no business logic, no fallbacks and no
 * invented values. An adapter that is not configured — or whose consent
 * category is denied — never loads a script and never sends.
 */

import { googleConfig, klaviyoConfig, metaConfig, pinterestConfig } from "@/config/marketing";

import type { ConsentCategory } from "./consent";
import type { CanonicalEvent, EventName } from "./events";

export type ProviderId = "gtm" | "ga4" | "meta" | "klaviyo" | "pinterest";

type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
  klaviyo?: { push: (args: unknown[]) => void };
  _learnq?: unknown[];
  pintrk?: (...args: unknown[]) => void;
};

function tagWindow(): TagWindow | null {
  return typeof window === "undefined" ? null : (window as TagWindow);
}

export type ProviderAdapter = {
  id: ProviderId;
  label: string;
  consent: ConsentCategory;
  isConfigured: () => boolean;
  /** Maps + sends. Returns false when nothing was sent (unmapped event). */
  send: (event: CanonicalEvent) => boolean;
};

/* ----------------------------- GA4 payload ---------------------------- */

const GA4_EVENTS: Partial<Record<EventName, string>> = {
  page_view: "page_view",
  view_item_list: "view_item_list",
  select_item: "select_item",
  view_item: "view_item",
  search: "search",
  add_to_wishlist: "add_to_wishlist",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  view_cart: "view_cart",
  begin_checkout: "begin_checkout",
  add_shipping_info: "add_shipping_info",
  add_payment_info: "add_payment_info",
  purchase: "purchase",
  refund: "refund",
  sign_up: "sign_up",
  login: "login",
  lead: "generate_lead",
  corporate_gifting_lead: "generate_lead",
  wedding_gifting_lead: "generate_lead",
  rewards_interest: "generate_lead",
  newsletter_signup: "sign_up",
  gift_finder_started: "gift_finder_started",
  gift_finder_completed: "gift_finder_completed",
  build_box_started: "build_box_started",
  build_box_completed: "build_box_completed",
  track_order: "track_order",
  store_view: "store_view",
  directions_click: "directions_click",
  call_click: "call_click",
  contact: "contact",
  share: "share",
  outbound_click: "click",
  cart_abandoned: "cart_abandoned",
  checkout_abandoned: "checkout_abandoned",
  cart_restored: "cart_restored",
};

export function ga4Payload(event: CanonicalEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...(event.params ?? {}) };
  if (event.currency) payload["currency"] = event.currency;
  if (typeof event.value === "number") payload["value"] = event.value;
  if (event.items) {
    payload["items"] = event.items.map((item) => ({
      item_id: item.item_id,
      item_name: item.item_name,
      ...(item.item_category ? { item_category: item.item_category } : {}),
      ...(item.item_variant ? { item_variant: item.item_variant } : {}),
      ...(item.item_brand ? { item_brand: item.item_brand } : {}),
      ...(typeof item.price === "number" ? { price: item.price } : {}),
      ...(item.quantity ? { quantity: item.quantity } : {}),
    }));
  }
  if (event.orderReference) payload["transaction_id"] = event.orderReference;
  payload["event_id"] = event.eventId;
  return payload;
}

/**
 * Deterministic dispatch path: when a GTM container is configured, GTM owns
 * tagging and the direct GA4 adapter stays silent. Exactly one of the two
 * fires, so GA4 can never double count.
 */
export const gtmOwnsTagging = (): boolean =>
  Boolean(googleConfig.gtmContainerId) || googleConfig.tagsOwnedByGtm;

export const gtmAdapter: ProviderAdapter = {
  id: "gtm",
  label: "Google Tag Manager",
  consent: "analytics",
  isConfigured: () => Boolean(googleConfig.gtmContainerId),
  send: (event) => {
    const w = tagWindow();
    if (!w) return false;
    const mapped = GA4_EVENTS[event.name] ?? event.name;
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event: mapped, oasis_event: event.name, ...ga4Payload(event) });
    return true;
  },
};

export const ga4Adapter: ProviderAdapter = {
  id: "ga4",
  label: "Google Analytics 4",
  consent: "analytics",
  isConfigured: () => Boolean(googleConfig.ga4MeasurementId) && !gtmOwnsTagging(),
  send: (event) => {
    const w = tagWindow();
    if (!w || typeof w.gtag !== "function") return false;
    const mapped = GA4_EVENTS[event.name];
    if (!mapped) return false;
    w.gtag("event", mapped, ga4Payload(event));
    return true;
  },
};

/* ------------------------------- Meta -------------------------------- */

export const META_STANDARD: Partial<Record<EventName, string>> = {
  page_view: "PageView",
  view_item: "ViewContent",
  view_item_list: "ViewContent",
  search: "Search",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  lead: "Lead",
  corporate_gifting_lead: "Lead",
  wedding_gifting_lead: "Lead",
  rewards_interest: "Lead",
  newsletter_signup: "CompleteRegistration",
  sign_up: "CompleteRegistration",
  contact: "Contact",
};

export const META_CUSTOM: Partial<Record<EventName, string>> = {
  gift_finder_completed: "GiftFinderCompleted",
  build_box_completed: "BuildBoxCompleted",
  cart_abandoned: "CartAbandoned",
  checkout_abandoned: "CheckoutAbandoned",
  store_view: "StoreView",
  track_order: "TrackOrder",
};

export function metaPayload(event: CanonicalEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (event.currency) payload["currency"] = event.currency;
  if (typeof event.value === "number") payload["value"] = event.value;
  if (event.items?.length) {
    payload["content_type"] = "product";
    payload["content_ids"] = event.items.map((item) => item.item_id);
    payload["contents"] = event.items.map((item) => ({
      id: item.item_id,
      quantity: item.quantity ?? 1,
      ...(typeof item.price === "number" ? { item_price: item.price } : {}),
    }));
  }
  const searchTerm = event.params?.["search_term"];
  if (typeof searchTerm === "string") payload["search_string"] = searchTerm;
  return payload;
}

export const metaAdapter: ProviderAdapter = {
  id: "meta",
  label: "Meta Pixel",
  consent: "marketing",
  isConfigured: () => Boolean(metaConfig.pixelId) && !googleConfig.tagsOwnedByGtm,
  send: (event) => {
    const w = tagWindow();
    if (!w || typeof w.fbq !== "function") return false;
    const standard = META_STANDARD[event.name];
    const custom = META_CUSTOM[event.name];
    if (!standard && !custom) return false;
    // eventID is shared with the server CAPI event so Meta de-duplicates.
    w.fbq(
      standard ? "track" : "trackCustom",
      standard ?? custom,
      metaPayload(event),
      { eventID: event.eventId },
    );
    return true;
  },
};

/* ------------------------------ Klaviyo ------------------------------ */

export const KLAVIYO_EVENTS: Partial<Record<EventName, string>> = {
  view_item: "Viewed Product",
  view_item_list: "Viewed Category",
  add_to_cart: "Added to Cart",
  remove_from_cart: "Removed from Cart",
  add_to_wishlist: "Added to Wishlist",
  search: "Searched Site",
  begin_checkout: "Started Checkout",
  purchase: "Placed Order",
  refund: "Refunded Order",
  order_delivered: "Order Delivered",
  newsletter_signup: "Subscribed to Newsletter",
  rewards_interest: "Registered Rewards Interest",
  corporate_gifting_lead: "Submitted Corporate Enquiry",
  wedding_gifting_lead: "Submitted Wedding Enquiry",
  gift_finder_completed: "Completed Gift Finder",
  build_box_completed: "Completed Build Your Own Box",
  cart_abandoned: "Cart Abandoned",
  checkout_abandoned: "Checkout Abandoned",
  track_order: "Tracked Order",
};

export function klaviyoPayload(event: CanonicalEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    EventId: event.eventId,
    Route: event.route,
    ...(event.params ?? {}),
  };
  if (event.currency) payload["Currency"] = event.currency;
  if (typeof event.value === "number") payload["Value"] = event.value;
  if (event.orderReference) payload["OrderReference"] = event.orderReference;
  if (event.items?.length) {
    payload["ItemCount"] = event.items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
    payload["Items"] = event.items.map((item) => ({
      ProductID: item.item_id,
      ProductName: item.item_name,
      ...(item.item_category ? { Category: item.item_category } : {}),
      ...(typeof item.price === "number" ? { ItemPrice: item.price } : {}),
      Quantity: item.quantity ?? 1,
    }));
  }
  return payload;
}

export const klaviyoAdapter: ProviderAdapter = {
  id: "klaviyo",
  label: "Klaviyo",
  consent: "marketing",
  isConfigured: () => Boolean(klaviyoConfig.publicKey),
  send: (event) => {
    const w = tagWindow();
    const mapped = KLAVIYO_EVENTS[event.name];
    if (!w || !mapped) return false;
    const queue = w.klaviyo ?? (w._learnq as { push: (args: unknown[]) => void } | undefined);
    if (!queue || typeof queue.push !== "function") return false;
    queue.push(["track", mapped, klaviyoPayload(event)]);
    return true;
  },
};

/* ----------------------------- Pinterest ----------------------------- */

export const PINTEREST_EVENTS: Partial<Record<EventName, string>> = {
  page_view: "pagevisit",
  view_item: "pagevisit",
  view_item_list: "viewcategory",
  search: "search",
  add_to_cart: "addtocart",
  purchase: "checkout",
  newsletter_signup: "signup",
  sign_up: "signup",
  lead: "lead",
};

export function pinterestPayload(event: CanonicalEvent): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (typeof event.value === "number") payload["value"] = event.value;
  if (event.currency) payload["currency"] = event.currency;
  if (event.items?.length) {
    payload["order_quantity"] = event.items.reduce((s, i) => s + (i.quantity ?? 1), 0);
    payload["line_items"] = event.items.map((item) => ({
      product_id: item.item_id,
      product_name: item.item_name,
      ...(item.item_category ? { product_category: item.item_category } : {}),
      ...(typeof item.price === "number" ? { product_price: item.price } : {}),
      product_quantity: item.quantity ?? 1,
    }));
  }
  return payload;
}

export const pinterestAdapter: ProviderAdapter = {
  id: "pinterest",
  label: "Pinterest Tag",
  consent: "marketing",
  isConfigured: () => Boolean(pinterestConfig.tagId),
  send: (event) => {
    const w = tagWindow();
    const mapped = PINTEREST_EVENTS[event.name];
    if (!w || !mapped || typeof w.pintrk !== "function") return false;
    w.pintrk("track", mapped, pinterestPayload(event));
    return true;
  },
};

export const adapters: ProviderAdapter[] = [
  gtmAdapter,
  ga4Adapter,
  metaAdapter,
  klaviyoAdapter,
  pinterestAdapter,
];
