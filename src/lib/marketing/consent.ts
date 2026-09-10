/**
 * PRIVACY-FIRST CONSENT MODEL
 *
 * Necessary is always on. Analytics and marketing are opt-in while
 * `consentConfig.required` is true — no measurement or marketing script is
 * allowed to load before an explicit decision. No dark patterns: accept and
 * decline are equally available and equally weighted in the UI.
 */

import { consentConfig } from "@/config/marketing";

export type ConsentCategory = "necessary" | "analytics" | "marketing";

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  /** ISO timestamp of the customer's decision, or null when undecided. */
  decidedAt: string | null;
  version: number;
};

export const CONSENT_STORAGE_KEY = "oasis.consent.v1";

export const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
  decidedAt: null,
  version: consentConfig.policyVersion,
};

/** Used when consent is not required by configuration (e.g. internal builds). */
export const permissiveConsent: ConsentState = {
  necessary: true,
  analytics: true,
  marketing: true,
  decidedAt: null,
  version: consentConfig.policyVersion,
};

export function consentDecided(state: ConsentState): boolean {
  return state.decidedAt !== null && state.version === consentConfig.policyVersion;
}

/** Whether a category may run right now. */
export function allows(state: ConsentState, category: ConsentCategory): boolean {
  if (category === "necessary") return true;
  if (!consentConfig.required) return true;
  if (!consentDecided(state)) return false;
  return category === "analytics" ? state.analytics : state.marketing;
}

export function parseConsent(raw: string | null): ConsentState {
  if (!raw) return consentConfig.required ? defaultConsent : permissiveConsent;
  try {
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (parsed.version !== consentConfig.policyVersion) return defaultConsent;
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
      decidedAt: typeof parsed.decidedAt === "string" ? parsed.decidedAt : null,
      version: consentConfig.policyVersion,
    };
  } catch {
    return defaultConsent;
  }
}

export function readConsent(): ConsentState {
  if (typeof window === "undefined") {
    return consentConfig.required ? defaultConsent : permissiveConsent;
  }
  try {
    return parseConsent(window.localStorage.getItem(CONSENT_STORAGE_KEY));
  } catch {
    return defaultConsent;
  }
}

export function writeConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the decision stays in memory for this session */
  }
}

export function decide(
  patch: { analytics: boolean; marketing: boolean },
  now = new Date(),
): ConsentState {
  return {
    necessary: true,
    analytics: patch.analytics,
    marketing: patch.marketing,
    decidedAt: now.toISOString(),
    version: consentConfig.policyVersion,
  };
}

/* ---------------------- Google Consent Mode v2 ---------------------- */

export type ConsentModeSignal = "granted" | "denied";

export type ConsentModeV2 = {
  ad_storage: ConsentModeSignal;
  ad_user_data: ConsentModeSignal;
  ad_personalization: ConsentModeSignal;
  analytics_storage: ConsentModeSignal;
  functionality_storage: ConsentModeSignal;
  security_storage: ConsentModeSignal;
  personalization_storage: ConsentModeSignal;
};

export function consentModeV2(state: ConsentState): ConsentModeV2 {
  const analytics: ConsentModeSignal = allows(state, "analytics") ? "granted" : "denied";
  const marketing: ConsentModeSignal = allows(state, "marketing") ? "granted" : "denied";
  return {
    ad_storage: marketing,
    ad_user_data: marketing,
    ad_personalization: marketing,
    analytics_storage: analytics,
    functionality_storage: "granted",
    security_storage: "granted",
    personalization_storage: marketing,
  };
}

/** Neutral consent snapshot carried on every canonical event. */
export function consentSnapshot(state: ConsentState) {
  return {
    analytics: allows(state, "analytics"),
    marketing: allows(state, "marketing"),
    decidedAt: state.decidedAt,
  };
}
