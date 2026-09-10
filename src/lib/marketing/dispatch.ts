/**
 * SINGLE DISPATCH PATH
 *
 * Every canonical event flows through here exactly once. The dispatcher owns
 * consent gating, enrichment (client/session id, route, attribution),
 * de-duplication and per-provider telemetry. Providers never enrich or decide.
 */

import { consentConfig } from "@/config/marketing";

import { approvedAttributionFields, readAttribution } from "./attribution";
import {
  allows,
  consentSnapshot,
  defaultConsent,
  permissiveConsent,
  type ConsentState,
} from "./consent";
import { buildEvent, type CanonicalEvent, type EventName, type TrackInput } from "./events";
import { clientId, sessionId } from "./identity";
import { adapters, type ProviderId } from "./providers";

/* --------------------------- Dispatcher state --------------------------- */

let consentState: ConsentState = consentConfig.required ? defaultConsent : permissiveConsent;
let customerId: string | undefined;
let serverBridge: ((event: CanonicalEvent) => void) | null = null;

export function setConsentState(state: ConsentState): void {
  consentState = state;
}

export function currentConsent(): ConsentState {
  return consentState;
}

/** Only set when the customer is known and identification is permitted. */
export function setCustomerId(id: string | undefined): void {
  customerId = id;
}

/** Installed once by the marketing runtime so server-side mirrors can fire. */
export function setServerBridge(bridge: ((event: CanonicalEvent) => void) | null): void {
  serverBridge = bridge;
}

/* ------------------------------ Telemetry ------------------------------ */

export type DispatchRecord = { event: EventName; at: string; ok: boolean };

const telemetry = new Map<ProviderId, DispatchRecord>();
const recent: CanonicalEvent[] = [];
const dispatchedOnce = new Set<string>();

/** Events that must fire at most once per browser session, keyed by identity. */
const ONCE_PER_KEY: Partial<Record<EventName, (e: CanonicalEvent) => string>> = {
  purchase: (e) => `purchase:${e.orderReference ?? e.eventId}`,
  refund: (e) => `refund:${e.orderReference ?? e.eventId}`,
};

const ONCE_STORAGE_KEY = "oasis.marketing.once.v1";

function readOnceKeys(): Set<string> {
  if (dispatchedOnce.size) return dispatchedOnce;
  if (typeof window === "undefined") return dispatchedOnce;
  try {
    const raw = window.localStorage.getItem(ONCE_STORAGE_KEY);
    if (raw) for (const key of JSON.parse(raw) as string[]) dispatchedOnce.add(key);
  } catch {
    /* ignore */
  }
  return dispatchedOnce;
}

function rememberOnceKey(key: string): void {
  dispatchedOnce.add(key);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONCE_STORAGE_KEY, JSON.stringify([...dispatchedOnce].slice(-50)));
  } catch {
    /* ignore */
  }
}

export function marketingTelemetry(): Record<string, DispatchRecord> {
  return Object.fromEntries(telemetry.entries());
}

export function recentEvents(): CanonicalEvent[] {
  return [...recent];
}

/* ------------------------- Server-mirrored events ------------------------ */

/** Events also sent server-side (Meta CAPI / Klaviyo API) with a shared event id. */
export const SERVER_MIRRORED: EventName[] = [
  "view_item",
  "search",
  "add_to_cart",
  "add_to_wishlist",
  "begin_checkout",
  "add_payment_info",
  "purchase",
  "refund",
  "lead",
  "corporate_gifting_lead",
  "wedding_gifting_lead",
  "rewards_interest",
  "newsletter_signup",
  "gift_finder_completed",
  "build_box_completed",
];

/* -------------------------------- track -------------------------------- */

function currentRoute(): string {
  if (typeof window === "undefined") return "/";
  return window.location.pathname + window.location.search;
}

export function track(input: TrackInput): CanonicalEvent | null {
  const event = buildEvent(input, {
    clientId: clientId(),
    sessionId: sessionId(),
    route: currentRoute(),
    consent: consentSnapshot(consentState),
    attributionFields: approvedAttributionFields(readAttribution()),
    ...(customerId ? { customerId } : {}),
  });

  const onceKey = ONCE_PER_KEY[event.name]?.(event);
  if (onceKey) {
    if (readOnceKeys().has(onceKey)) return null;
    rememberOnceKey(onceKey);
  }

  recent.push(event);
  if (recent.length > 50) recent.shift();

  if (import.meta.env.DEV) {
    // Development-only visibility; never logged in production builds.
    console.debug("[oasis:event]", event.name, event);
  }

  for (const adapter of adapters) {
    if (!adapter.isConfigured()) continue;
    if (!allows(consentState, adapter.consent)) continue;
    let ok = false;
    try {
      ok = adapter.send(event);
    } catch {
      ok = false;
    }
    telemetry.set(adapter.id, { event: event.name, at: event.timestamp, ok });
  }

  if (serverBridge && SERVER_MIRRORED.includes(event.name) && allows(consentState, "marketing")) {
    try {
      serverBridge(event);
    } catch {
      /* server mirror is best-effort and never blocks the UI */
    }
  }

  return event;
}
