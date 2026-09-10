/**
 * CENTRAL MARKETING / PROMOTION CONFIGURATION
 *
 * One typed place for every promotion, measurement and lifecycle channel.
 * Nothing here invents an ID, token or URL: every value comes from the
 * environment and is simply absent (reported as an admin readiness blocker)
 * until a real value is supplied.
 *
 * Client-safe values use VITE_* and may be read in the browser.
 * Secrets (Klaviyo private key, Meta CAPI token, diagnostics token) are read
 * ONLY inside server handlers via `serverMarketingSecrets()`.
 */

import {
  analyticsConfig,
  statusOf,
  type IntegrationStatus,
  type ReadinessItem,
} from "./integrations";

function viteEnv(key: string): string {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const value = env ? (env[key] as string | undefined) : undefined;
  return (value ?? "").trim();
}

function flag(key: string, fallback: boolean): boolean {
  const raw = viteEnv(key).toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

/* ------------------------------------------------------------------ */
/* Google: GA4, GTM, Ads, Merchant Center, Search Console              */
/* ------------------------------------------------------------------ */

export const googleConfig = {
  ga4MeasurementId: analyticsConfig.ga4MeasurementId,
  gtmContainerId: analyticsConfig.gtmContainerId,
  /** When true, GTM owns all tagging and direct GA4/Pixel loaders stay off. */
  tagsOwnedByGtm: analyticsConfig.tagsOwnedByGtm,
  searchConsoleVerification: analyticsConfig.searchConsoleVerification,
  merchantId: analyticsConfig.merchantCenterId,
  adsConversionId: viteEnv("VITE_GOOGLE_ADS_CONVERSION_ID"),
  adsPurchaseLabel: viteEnv("VITE_GOOGLE_ADS_PURCHASE_LABEL"),
  adsLeadLabel: viteEnv("VITE_GOOGLE_ADS_LEAD_LABEL"),
} as const;

/* ------------------------------------------------------------------ */
/* Meta (Pixel + Conversions API)                                      */
/* ------------------------------------------------------------------ */

export const metaConfig = {
  pixelId: viteEnv("VITE_META_PIXEL_ID") || analyticsConfig.metaPixelId,
} as const;

/* ------------------------------------------------------------------ */
/* Klaviyo (lifecycle marketing)                                       */
/* ------------------------------------------------------------------ */

export const klaviyoConfig = {
  /** Klaviyo public API key / site id (safe in the browser). */
  publicKey: viteEnv("VITE_KLAVIYO_PUBLIC_KEY"),
  /** Optional default subscription list for newsletter opt-in. */
  newsletterListId: viteEnv("VITE_KLAVIYO_NEWSLETTER_LIST_ID"),
} as const;

/* ------------------------------------------------------------------ */
/* Pinterest                                                           */
/* ------------------------------------------------------------------ */

export const pinterestConfig = {
  tagId: viteEnv("VITE_PINTEREST_TAG_ID"),
} as const;

/* ------------------------------------------------------------------ */
/* Official owned channels + local discovery                           */
/* ------------------------------------------------------------------ */

export const channelUrls = {
  facebook: viteEnv("VITE_CHANNEL_FACEBOOK_URL"),
  instagram: viteEnv("VITE_CHANNEL_INSTAGRAM_URL"),
  youtube: viteEnv("VITE_CHANNEL_YOUTUBE_URL"),
  pinterest: viteEnv("VITE_CHANNEL_PINTEREST_URL"),
  linkedin: viteEnv("VITE_CHANNEL_LINKEDIN_URL"),
  x: viteEnv("VITE_CHANNEL_X_URL"),
  /** Primary Google Business Profile (brand level). Per-store URLs live on location records. */
  googleBusiness: viteEnv("VITE_GOOGLE_BUSINESS_URL"),
  /** D2C WhatsApp number in E.164 digits, e.g. 917291994141. */
  whatsappNumber: viteEnv("VITE_WHATSAPP_NUMBER").replace(/[^0-9]/g, ""),
} as const;

/** wa.me link, or empty string when no D2C number is configured. */
export function whatsappUrl(message?: string): string {
  if (!channelUrls.whatsappNumber) return "";
  const base = `https://wa.me/${channelUrls.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/* ------------------------------------------------------------------ */
/* Consent policy                                                      */
/* ------------------------------------------------------------------ */

export const consentConfig = {
  /**
   * Consent is required by default. Marketing/analytics scripts never load
   * before an explicit decision while this is on.
   */
  required: flag("VITE_CONSENT_REQUIRED", true),
  policyVersion: 1,
} as const;

/* ------------------------------------------------------------------ */
/* Server-only secrets                                                 */
/* ------------------------------------------------------------------ */

export type ServerMarketingSecrets = {
  klaviyoPrivateKey: string;
  metaCapiToken: string;
  metaTestEventCode: string;
  diagnosticsToken: string;
};

/** MUST be called inside a server handler — env is injected per request. */
export function serverMarketingSecrets(): ServerMarketingSecrets {
  const env = typeof process !== "undefined" && process.env ? process.env : {};
  const read = (key: string) => (env[key] ?? "").trim();
  return {
    klaviyoPrivateKey: read("KLAVIYO_PRIVATE_API_KEY"),
    metaCapiToken: read("META_CAPI_ACCESS_TOKEN"),
    metaTestEventCode: read("META_TEST_EVENT_CODE"),
    diagnosticsToken: read("MARKETING_DIAGNOSTICS_TOKEN"),
  };
}

/* ------------------------------------------------------------------ */
/* Klaviyo automation contract (documentation, not fake IDs)           */
/* ------------------------------------------------------------------ */

export type AutomationFlow = {
  id: string;
  label: string;
  /** Canonical event name(s) that trigger the flow. */
  triggers: string[];
  /** What the Klaviyo template must contain before it may be switched on. */
  requires: string;
};

/**
 * Lifecycle flows this website already emits the events for. Template IDs are
 * intentionally absent: they are created inside Klaviyo and supplied later.
 */
export const automationFlows: AutomationFlow[] = [
  {
    id: "welcome",
    label: "Welcome series",
    triggers: ["newsletter_signup", "sign_up"],
    requires: "Klaviyo list + welcome template",
  },
  {
    id: "browse-abandon",
    label: "Browse abandonment",
    triggers: ["view_item", "view_item_list"],
    requires: "Klaviyo Viewed Product flow",
  },
  {
    id: "cart-abandon",
    label: "Cart abandonment",
    triggers: ["add_to_cart", "cart_abandoned"],
    requires: "Klaviyo Added to Cart flow + restore-cart link block",
  },
  {
    id: "checkout-abandon",
    label: "Checkout abandonment",
    triggers: ["begin_checkout", "checkout_abandoned"],
    requires: "Klaviyo Started Checkout flow",
  },
  {
    id: "post-purchase",
    label: "Post-purchase thank you & care",
    triggers: ["purchase"],
    requires: "Klaviyo Placed Order flow",
  },
  {
    id: "delivery-follow-up",
    label: "Delivery follow-up / review request",
    triggers: ["order_delivered"],
    requires: "Appverse delivery webhook + Klaviyo template",
  },
  {
    id: "replenishment",
    label: "Replenishment / reorder reminder",
    triggers: ["purchase", "order_delivered"],
    requires: "Authoritative order history from Appverse",
  },
  {
    id: "festive",
    label: "Festive / occasion campaigns",
    triggers: ["gift_finder_completed", "purchase"],
    requires: "Consented segment + campaign template",
  },
  {
    id: "vip",
    label: "VIP / high-value gifting segment",
    triggers: ["purchase", "corporate_gifting_lead"],
    requires: "Order-value thresholds agreed with Oasis Central",
  },
  {
    id: "b2b-nurture",
    label: "Corporate & wedding lead nurture",
    triggers: ["corporate_gifting_lead", "wedding_gifting_lead"],
    requires: "Sales-owned nurture template",
  },
  {
    id: "rewards-nurture",
    label: "Rewards interest nurture",
    triggers: ["rewards_interest"],
    requires: "Published rewards programme terms",
  },
];

/* ------------------------------------------------------------------ */
/* Readiness (client-safe portion, consumed by /admin/status)          */
/* ------------------------------------------------------------------ */

const anyChannel = Object.values(channelUrls).some((value) => Boolean(value));

export function marketingReadiness(): ReadinessItem[] {
  const items: { id: string; label: string; status: IntegrationStatus; requires: string }[] = [
    {
      id: "ga4",
      label: "Google Analytics 4",
      status: statusOf(googleConfig.ga4MeasurementId),
      requires: "GA4 measurement ID",
    },
    {
      id: "gtm",
      label: "Google Tag Manager",
      status: statusOf(googleConfig.gtmContainerId),
      requires: "GTM container ID",
    },
    {
      id: "google-ads",
      label: "Google Ads conversion tracking",
      status: statusOf(googleConfig.adsConversionId),
      requires: "Ads conversion ID + purchase/lead labels",
    },
    {
      id: "merchant-id",
      label: "Google Merchant Center account",
      status: statusOf(googleConfig.merchantId),
      requires: "Merchant Center ID (feed endpoint is already live)",
    },
    {
      id: "search-console",
      label: "Search Console verification",
      status: statusOf(googleConfig.searchConsoleVerification),
      requires: "google-site-verification token",
    },
    {
      id: "meta-pixel",
      label: "Meta Pixel (browser)",
      status: statusOf(metaConfig.pixelId),
      requires: "Meta Pixel ID",
    },
    {
      id: "klaviyo-public",
      label: "Klaviyo (browser events)",
      status: statusOf(klaviyoConfig.publicKey),
      requires: "Klaviyo public API key / site ID",
    },
    {
      id: "klaviyo-list",
      label: "Klaviyo newsletter list",
      status: statusOf(klaviyoConfig.newsletterListId),
      requires: "Klaviyo list ID for newsletter opt-in",
    },
    {
      id: "pinterest",
      label: "Pinterest Tag",
      status: statusOf(pinterestConfig.tagId),
      requires: "Pinterest tag ID",
    },
    {
      id: "channels",
      label: "Official social & profile URLs",
      status: anyChannel ? "configured" : "not-configured",
      requires: "Official Facebook / Instagram / YouTube / Pinterest / LinkedIn / X URLs",
    },
    {
      id: "google-business",
      label: "Google Business Profile link",
      status: statusOf(channelUrls.googleBusiness),
      requires: "Verified Google Business Profile URL",
    },
    {
      id: "whatsapp",
      label: "D2C WhatsApp channel",
      status: statusOf(channelUrls.whatsappNumber),
      requires: "WhatsApp business number in E.164 form",
    },
    {
      id: "consent",
      label: `Consent manager (${consentConfig.required ? "enforced" : "advisory"})`,
      status: "configured",
      requires: "",
    },
  ];

  return items.map((item) => ({
    ...item,
    group: "Marketing" as const,
    ...(item.requires ? { requires: item.requires } : {}),
  }));
}
