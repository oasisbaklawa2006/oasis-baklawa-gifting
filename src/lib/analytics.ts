/**
 * PROVIDER-NEUTRAL ANALYTICS EVENT MODEL
 *
 * One event vocabulary for the whole storefront. Destinations (GA4, GTM data
 * layer, Meta Pixel) are attached only when their IDs are configured, so the
 * app is silent — never broken — before real IDs exist.
 *
 * Double counting is avoided: when GTM owns tagging, direct GA4/Pixel sends
 * are suppressed and only the data layer receives events.
 */

import { analyticsConfig } from "@/config/integrations";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price?: number;
  quantity?: number;
  currency?: string;
};

export type AnalyticsEvent =
  | { name: "page_view"; params: { page_path: string; page_title?: string } }
  | { name: "view_item_list"; params: { item_list_name: string; items: AnalyticsItem[] } }
  | { name: "view_item"; params: { currency: string; value: number; items: AnalyticsItem[] } }
  | { name: "select_item"; params: { item_list_name: string; items: AnalyticsItem[] } }
  | { name: "add_to_wishlist"; params: { items: AnalyticsItem[] } }
  | { name: "add_to_cart"; params: { currency: string; value: number; items: AnalyticsItem[] } }
  | {
      name: "remove_from_cart";
      params: { currency: string; value: number; items: AnalyticsItem[] };
    }
  | { name: "view_cart"; params: { currency: string; value: number; items: AnalyticsItem[] } }
  | { name: "begin_checkout"; params: { currency: string; value: number; items: AnalyticsItem[] } }
  | {
      name: "add_shipping_info";
      params: { currency: string; value: number; shipping_tier: string };
    }
  | { name: "add_payment_info"; params: { currency: string; value: number; payment_type: string } }
  | {
      name: "purchase";
      params: { transaction_id: string; currency: string; value: number; items: AnalyticsItem[] };
    }
  | { name: "search"; params: { search_term: string; results: number } }
  | { name: "generate_lead"; params: { lead_type: string } }
  | { name: "sign_up_newsletter"; params: { placement: string } }
  | { name: "gift_configured"; params: { has_message: boolean; conceal_invoice: boolean } }
  | { name: "build_a_gift_step"; params: { step: string; capacity?: number } }
  | { name: "recipient_import"; params: { rows: number; valid: number; errors: number } }
  | { name: "delivery_check"; params: { pincode_prefix: string; eligible: boolean } }
  | { name: "outbound_click"; params: { channel: string; placement: string } }
  | { name: "track_order"; params: { found: boolean } }
  | { name: "gift_finder_step"; params: { step: string; value: string } };

type WindowWithTags = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

const META_EVENT_MAP: Partial<Record<AnalyticsEvent["name"], string>> = {
  page_view: "PageView",
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  search: "Search",
  generate_lead: "Lead",
  sign_up_newsletter: "CompleteRegistration",
};

/** Buffered when no destination is live yet — useful for local verification. */
const buffer: { name: string; params: unknown; at: number }[] = [];

export function recentEvents() {
  return [...buffer];
}

export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  const w = window as WindowWithTags;
  const { name, params } = event;

  buffer.push({ name, params, at: Date.now() });
  if (buffer.length > 50) buffer.shift();

  // Data layer always receives the event when GTM is configured.
  if (analyticsConfig.gtmContainerId) {
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push({ event: name, ...(params as Record<string, unknown>) });
  }

  if (analyticsConfig.tagsOwnedByGtm) return;

  if (analyticsConfig.ga4MeasurementId && typeof w.gtag === "function") {
    w.gtag("event", name, params as Record<string, unknown>);
  }

  const metaName = META_EVENT_MAP[name];
  if (analyticsConfig.metaPixelId && metaName && typeof w.fbq === "function") {
    w.fbq("track", metaName, params as Record<string, unknown>);
  }
}

/** Head scripts for whichever tag destinations are configured. */
export function tagScripts(): { src?: string; children?: string; async?: boolean }[] {
  const scripts: { src?: string; children?: string; async?: boolean }[] = [];
  const { ga4MeasurementId, gtmContainerId, metaPixelId, tagsOwnedByGtm } = analyticsConfig;

  if (gtmContainerId) {
    scripts.push({
      children: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`,
    });
  }

  if (ga4MeasurementId && !tagsOwnedByGtm) {
    scripts.push({
      src: `https://www.googletagmanager.com/gtag/js?id=${ga4MeasurementId}`,
      async: true,
    });
    scripts.push({
      children: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga4MeasurementId}',{send_page_view:false});`,
    });
  }

  if (metaPixelId && !tagsOwnedByGtm) {
    scripts.push({
      children: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');`,
    });
  }

  return scripts;
}
