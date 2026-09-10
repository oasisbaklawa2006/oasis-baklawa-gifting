/**
 * CONSENT-GATED TAG LOADING
 *
 * No measurement or marketing script is injected until the corresponding
 * consent category is allowed. Consent Mode v2 defaults are set inline (no
 * network call) so Google tags start denied and are updated on decision.
 */

import { googleConfig, klaviyoConfig, metaConfig, pinterestConfig } from "@/config/marketing";

import { allows, consentModeV2, type ConsentState } from "./consent";
import { gtmOwnsTagging } from "./providers";

type TagWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: ((...args: unknown[]) => void) & { queue?: unknown[]; callMethod?: unknown; loaded?: boolean; version?: string; push?: unknown };
  _fbq?: unknown;
  klaviyo?: { push: (args: unknown[]) => void };
  _learnq?: unknown[];
  pintrk?: ((...args: unknown[]) => void) & { queue?: unknown[]; version?: string };
};

const loaded = new Set<string>();

/** Inline Consent Mode v2 default script — safe before any consent. */
export const consentModeDefaultScript = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',personalization_storage:'denied',wait_for_update:500});`;

function injectSrc(key: string, src: string): void {
  if (loaded.has(key) || typeof document === "undefined") return;
  loaded.add(key);
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function injectInline(key: string, code: string): void {
  if (loaded.has(key) || typeof document === "undefined") return;
  loaded.add(key);
  const script = document.createElement("script");
  script.text = code;
  document.head.appendChild(script);
}

/** Pushes the customer's decision into Google Consent Mode v2. */
export function updateConsentMode(state: ConsentState): void {
  if (typeof window === "undefined") return;
  const w = window as TagWindow;
  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push(["consent", "update", consentModeV2(state)]);
  if (typeof w.gtag === "function") w.gtag("consent", "update", consentModeV2(state));
}

/** Loads exactly the tags the customer has allowed. Idempotent. */
export function loadMarketingScripts(state: ConsentState): void {
  if (typeof window === "undefined") return;
  const w = window as TagWindow;
  const analyticsOk = allows(state, "analytics");
  const marketingOk = allows(state, "marketing");

  if (analyticsOk && googleConfig.gtmContainerId) {
    injectInline(
      "gtm",
      `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${googleConfig.gtmContainerId}');`,
    );
  }

  if (analyticsOk && googleConfig.ga4MeasurementId && !gtmOwnsTagging()) {
    injectSrc("ga4", `https://www.googletagmanager.com/gtag/js?id=${googleConfig.ga4MeasurementId}`);
    injectInline(
      "ga4-init",
      `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config','${googleConfig.ga4MeasurementId}',{send_page_view:false});${
        googleConfig.adsConversionId ? `gtag('config','${googleConfig.adsConversionId}');` : ""
      }`,
    );
  }

  if (marketingOk && metaConfig.pixelId && !googleConfig.tagsOwnedByGtm) {
    injectInline(
      "meta",
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('consent','grant');fbq('init','${metaConfig.pixelId}');`,
    );
  }

  if (marketingOk && klaviyoConfig.publicKey) {
    injectInline("klaviyo-queue", `window._learnq=window._learnq||[];`);
    injectSrc(
      "klaviyo",
      `https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${klaviyoConfig.publicKey}`,
    );
  }

  if (marketingOk && pinterestConfig.tagId) {
    injectInline(
      "pinterest",
      `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${pinterestConfig.tagId}');pintrk('page');`,
    );
  }

  updateConsentMode(state);
  void w;
}

/** Test/diagnostic helper. */
export function loadedTagKeys(): string[] {
  return [...loaded];
}
