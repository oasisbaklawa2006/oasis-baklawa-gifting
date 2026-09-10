/**
 * Compatibility surface for the canonical event model.
 *
 * Existing call sites keep using `track({ name, params })`; the canonical
 * dispatcher owns consent gating, enrichment, attribution and provider
 * mapping. Legacy event names are mapped to canonical ones here, in one place.
 */

import { track as dispatch, recentEvents as canonicalRecentEvents } from "@/lib/marketing/dispatch";
import type { AnalyticsItem, EventName } from "@/lib/marketing/events";

export type { AnalyticsItem };

const LEGACY_NAMES: Record<string, EventName> = {
  generate_lead: "lead",
  sign_up_newsletter: "newsletter_signup",
  gift_finder_step: "gift_finder_started",
  build_a_gift_step: "build_box_started",
};

export type LegacyEvent = {
  name: EventName | keyof typeof LEGACY_NAMES | string;
  params?: Record<string, unknown>;
};

export function track(event: LegacyEvent): void {
  const params = { ...(event.params ?? {}) };
  const name = (LEGACY_NAMES[event.name] ?? event.name) as EventName;

  const currency =
    typeof params["currency"] === "string" ? (params["currency"] as string) : undefined;
  const value = typeof params["value"] === "number" ? (params["value"] as number) : undefined;
  const items = Array.isArray(params["items"]) ? (params["items"] as AnalyticsItem[]) : undefined;
  const orderReference =
    typeof params["transaction_id"] === "string" ? (params["transaction_id"] as string) : undefined;

  delete params["currency"];
  delete params["value"];
  delete params["items"];

  dispatch({
    name,
    params,
    ...(currency ? { currency } : {}),
    ...(typeof value === "number" ? { value } : {}),
    ...(items ? { items } : {}),
    ...(orderReference ? { orderReference } : {}),
  });
}

export const recentEvents = canonicalRecentEvents;
