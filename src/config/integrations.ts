/**
 * CENTRAL INTEGRATION CONFIGURATION
 *
 * Single source of truth for every external system the storefront can talk to.
 * Nothing here invents an ID, URL or credential: each value is read from the
 * environment and is simply absent (and therefore reported as "not configured")
 * until a real value is supplied.
 *
 * Client-safe values use VITE_* and may be read in the browser.
 * Server-only values are read inside server handlers via process.env.
 */

export type IntegrationStatus = "configured" | "not-configured" | "disabled";

function viteEnv(key: string): string {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const value = env ? (env[key] as string | undefined) : undefined;
  return (value ?? "").trim();
}

function flag(key: string, fallback = false): boolean {
  const raw = viteEnv(key).toLowerCase();
  if (!raw) return fallback;
  return raw === "1" || raw === "true" || raw === "yes";
}

export const statusOf = (value: string): IntegrationStatus =>
  value ? "configured" : "not-configured";

/* ------------------------------------------------------------------ */
/* Commerce provider                                                   */
/* ------------------------------------------------------------------ */

export type CommerceProviderId = "native" | "shopify";

/**
 * The commerce provider is a configuration decision, never a code decision.
 * Default is `native` (this app's own backend boundary). Switching to Shopify
 * later is an env change plus credentials — no presentation rewrite.
 */
export const commerceProvider: CommerceProviderId =
  viteEnv("VITE_COMMERCE_PROVIDER") === "shopify" ? "shopify" : "native";

export const shopifyConfig = {
  domain: viteEnv("VITE_SHOPIFY_STORE_DOMAIN"),
  storefrontToken: viteEnv("VITE_SHOPIFY_STOREFRONT_TOKEN"),
} as const;

/* ------------------------------------------------------------------ */
/* Appverse / Oasis Central (system of record)                          */
/* ------------------------------------------------------------------ */

export const appverse = {
  /** Base URL of the Central/Appverse connector API. */
  baseUrl: viteEnv("VITE_APPVERSE_BASE_URL"),
  /** Versioned contract this storefront speaks. */
  contractVersion: "2026-09-01",
  /** Approved deep link for authorized staff (never shown to customers). */
  consoleUrl: viteEnv("VITE_APPVERSE_CONSOLE_URL"),
} as const;

/** Governed catalogue snapshot source (AI Studio / presentation authority). */
export const catalogueSource = {
  baseUrl: viteEnv("VITE_CATALOGUE_SNAPSHOT_URL"),
  /** Falls back to the in-repo governed snapshot when no remote is configured. */
  mode: viteEnv("VITE_CATALOGUE_SNAPSHOT_URL") ? "remote" : ("local-snapshot" as const),
} as const;

/* ------------------------------------------------------------------ */
/* Analytics, tags and channels                                        */
/* ------------------------------------------------------------------ */

export const analyticsConfig = {
  ga4MeasurementId: viteEnv("VITE_GA4_MEASUREMENT_ID"),
  gtmContainerId: viteEnv("VITE_GTM_CONTAINER_ID"),
  metaPixelId: viteEnv("VITE_META_PIXEL_ID"),
  /** When GTM owns tags, the direct GA4/Pixel loaders stay off to avoid double counting. */
  tagsOwnedByGtm: flag("VITE_TAGS_OWNED_BY_GTM", false),
  searchConsoleVerification: viteEnv("VITE_GOOGLE_SITE_VERIFICATION"),
  merchantCenterId: viteEnv("VITE_GOOGLE_MERCHANT_ID"),
} as const;

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export type PaymentProviderId = "none" | "razorpay" | "stripe";

export const paymentProvider: PaymentProviderId = (() => {
  const raw = viteEnv("VITE_PAYMENT_PROVIDER");
  return raw === "razorpay" || raw === "stripe" ? raw : "none";
})();

/** Public key only. Secrets never reach the browser. */
export const paymentPublicKey = viteEnv("VITE_PAYMENT_PUBLIC_KEY");

/** Gateway credentials alone cannot certify an order or authorize a charge. */
export const paymentsLive = false;

/* ------------------------------------------------------------------ */
/* Currency policy                                                     */
/* ------------------------------------------------------------------ */

export const currencyPolicy = {
  /** Money is always captured and settled in INR. */
  settlement: "INR" as const,
  /** Display currencies are only offered when a governed rate source exists. */
  rateSourceUrl: viteEnv("VITE_FX_RATE_SOURCE_URL"),
  get displayCurrenciesEnabled() {
    return Boolean(viteEnv("VITE_FX_RATE_SOURCE_URL"));
  },
} as const;

/* ------------------------------------------------------------------ */
/* Readiness report (consumed by the private status surface)           */
/* ------------------------------------------------------------------ */

export type ReadinessItem = {
  id: string;
  group:
    | "Commerce"
    | "Catalogue"
    | "Analytics"
    | "Payments"
    | "Channels"
    | "Site"
    | "Marketing"
    | "Lifecycle";
  label: string;
  status: IntegrationStatus;
  /** What an owner must supply when this is not configured. */
  requires?: string;
};

export function readinessReport(extra: ReadinessItem[] = []): ReadinessItem[] {
  return [
    {
      id: "commerce-provider",
      group: "Commerce",
      label: `Commerce provider: ${commerceProvider}`,
      status: "configured",
    },
    {
      id: "shopify",
      group: "Commerce",
      label: "Shopify adapter credentials",
      status:
        commerceProvider === "shopify"
          ? statusOf(shopifyConfig.domain && shopifyConfig.storefrontToken)
          : "disabled",
      requires: "Shopify store domain + Storefront API token",
    },
    {
      id: "appverse",
      group: "Catalogue",
      label: "Oasis Central / Appverse connector",
      status: statusOf(appverse.baseUrl),
      requires: "VITE_APPVERSE_BASE_URL and an issued connector key",
    },
    {
      id: "catalogue",
      group: "Catalogue",
      label: `Catalogue snapshot source (${catalogueSource.mode})`,
      status: catalogueSource.baseUrl ? "configured" : "not-configured",
      requires: "Governed catalogue snapshot endpoint",
    },
    {
      id: "ga4",
      group: "Analytics",
      label: "Google Analytics 4",
      status: statusOf(analyticsConfig.ga4MeasurementId),
      requires: "GA4 measurement ID (G-XXXXXXX)",
    },
    {
      id: "gtm",
      group: "Analytics",
      label: "Google Tag Manager",
      status: statusOf(analyticsConfig.gtmContainerId),
      requires: "GTM container ID (GTM-XXXXXX)",
    },
    {
      id: "meta-pixel",
      group: "Analytics",
      label: "Meta Pixel",
      status: statusOf(analyticsConfig.metaPixelId),
      requires: "Meta Pixel ID",
    },
    {
      id: "search-console",
      group: "Analytics",
      label: "Search Console verification",
      status: statusOf(analyticsConfig.searchConsoleVerification),
      requires: "google-site-verification token",
    },
    {
      id: "merchant-center",
      group: "Channels",
      label: "Google Merchant Center feed",
      status: statusOf(analyticsConfig.merchantCenterId),
      requires: "Merchant Center account ID (feed endpoint already live)",
    },
    {
      id: "payments",
      group: "Payments",
      label: `Payment provider: ${paymentProvider}`,
      status: paymentsLive ? "configured" : "not-configured",
      requires: "Gateway merchant ID, public key and server-side secret",
    },
    {
      id: "fx",
      group: "Site",
      label: "Multi-currency display rates",
      status: statusOf(currencyPolicy.rateSourceUrl),
      requires: "Approved FX rate source (settlement stays INR)",
    },
    ...extra,
  ];
}
