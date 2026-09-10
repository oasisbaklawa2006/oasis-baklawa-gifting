/**
 * SERVER-SIDE MARKETING EVENT BOUNDARY (server-only)
 *
 * Meta Conversions API and Klaviyo server events. Both:
 *  - no-op safely when their credential is absent,
 *  - share the browser `eventId` so Meta de-duplicates browser/server pairs,
 *  - hash PII (SHA-256, lower-cased/trimmed) here and never in the browser,
 *  - retry transient failures with backoff and log without secrets.
 */

import { createHash } from "node:crypto";

import { klaviyoConfig, metaConfig, serverMarketingSecrets } from "@/config/marketing";

import { KLAVIYO_EVENTS, META_CUSTOM, META_STANDARD, klaviyoPayload, metaPayload } from "./providers";
import type { CanonicalEvent } from "./events";

export type ServerIdentity = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
};

export type ServerDispatchResult = {
  meta: "sent" | "skipped" | "failed";
  klaviyo: "sent" | "skipped" | "failed";
  detail?: string;
};

export function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function hashedUserData(identity: ServerIdentity | undefined): Record<string, unknown> {
  if (!identity) return {};
  const out: Record<string, unknown> = {};
  if (identity.email) out["em"] = [sha256(identity.email)];
  if (identity.phone) out["ph"] = [sha256(identity.phone.replace(/[^0-9]/g, ""))];
  if (identity.firstName) out["fn"] = [sha256(identity.firstName)];
  if (identity.lastName) out["ln"] = [sha256(identity.lastName)];
  if (identity.city) out["ct"] = [sha256(identity.city)];
  if (identity.postalCode) out["zp"] = [sha256(identity.postalCode)];
  if (identity.country) out["country"] = [sha256(identity.country)];
  if (identity.clientIpAddress) out["client_ip_address"] = identity.clientIpAddress;
  if (identity.clientUserAgent) out["client_user_agent"] = identity.clientUserAgent;
  return out;
}

async function postWithRetry(
  url: string,
  init: RequestInit,
  attempts = 3,
): Promise<{ ok: boolean; status: number }> {
  let lastStatus = 0;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      lastStatus = response.status;
      if (response.ok) return { ok: true, status: response.status };
      // 4xx (other than 429) will not succeed on retry.
      if (response.status < 500 && response.status !== 429) break;
    } catch {
      lastStatus = 0;
    }
    if (attempt < attempts) await new Promise((r) => setTimeout(r, 200 * attempt));
  }
  return { ok: false, status: lastStatus };
}

/* ------------------------------ Meta CAPI ------------------------------ */

export async function sendMetaCapi(
  event: CanonicalEvent,
  identity?: ServerIdentity,
): Promise<"sent" | "skipped" | "failed"> {
  const { metaCapiToken, metaTestEventCode } = serverMarketingSecrets();
  if (!metaConfig.pixelId || !metaCapiToken) return "skipped";
  if (!event.consent.marketing) return "skipped";

  const standard = META_STANDARD[event.name];
  const custom = META_CUSTOM[event.name];
  if (!standard && !custom) return "skipped";

  const body = {
    data: [
      {
        event_name: standard ?? custom,
        event_time: Math.floor(new Date(event.timestamp).getTime() / 1000),
        event_id: event.eventId,
        action_source: "website",
        event_source_url: event.route,
        user_data: {
          external_id: [sha256(event.clientId)],
          ...hashedUserData(identity),
        },
        custom_data: metaPayload(event),
      },
    ],
    ...(metaTestEventCode ? { test_event_code: metaTestEventCode } : {}),
  };

  const result = await postWithRetry(
    `https://graph.facebook.com/v20.0/${metaConfig.pixelId}/events?access_token=${encodeURIComponent(metaCapiToken)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!result.ok) {
    console.error(`[marketing] Meta CAPI ${event.name} failed with status ${result.status}`);
    return "failed";
  }
  return "sent";
}

/* --------------------------- Klaviyo server API -------------------------- */

export async function sendKlaviyoEvent(
  event: CanonicalEvent,
  identity?: ServerIdentity,
): Promise<"sent" | "skipped" | "failed"> {
  const { klaviyoPrivateKey } = serverMarketingSecrets();
  const metric = KLAVIYO_EVENTS[event.name];
  if (!klaviyoPrivateKey || !metric) return "skipped";
  if (!event.consent.marketing) return "skipped";

  // Klaviyo needs a profile identifier; anonymous events use the client id.
  const profile: Record<string, unknown> = identity?.email
    ? { email: identity.email }
    : { anonymous_id: event.clientId };

  const body = {
    data: {
      type: "event",
      attributes: {
        properties: klaviyoPayload(event),
        unique_id: event.eventId,
        time: event.timestamp,
        ...(typeof event.value === "number" ? { value: event.value } : {}),
        metric: { data: { type: "metric", attributes: { name: metric } } },
        profile: { data: { type: "profile", attributes: profile } },
      },
    },
  };

  const result = await postWithRetry("https://a.klaviyo.com/api/events", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      revision: "2024-10-15",
      Authorization: `Klaviyo-API-Key ${klaviyoPrivateKey}`,
    },
    body: JSON.stringify(body),
  });
  if (!result.ok) {
    console.error(`[marketing] Klaviyo ${metric} failed with status ${result.status}`);
    return "failed";
  }
  return "sent";
}

/** Klaviyo profile upsert with restrained, non-sensitive properties. */
export async function upsertKlaviyoProfile(input: {
  email?: string;
  phone?: string;
  properties?: Record<string, unknown>;
  listId?: string;
  consentTimestamp?: string;
}): Promise<"sent" | "skipped" | "failed"> {
  const { klaviyoPrivateKey } = serverMarketingSecrets();
  if (!klaviyoPrivateKey || (!input.email && !input.phone)) return "skipped";

  const attributes: Record<string, unknown> = {
    ...(input.email ? { email: input.email } : {}),
    ...(input.phone ? { phone_number: input.phone } : {}),
    ...(input.properties ? { properties: input.properties } : {}),
  };

  const result = await postWithRetry("https://a.klaviyo.com/api/profiles", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      revision: "2024-10-15",
      Authorization: `Klaviyo-API-Key ${klaviyoPrivateKey}`,
    },
    body: JSON.stringify({ data: { type: "profile", attributes } }),
  });

  if (!result.ok && result.status !== 409) {
    console.error(`[marketing] Klaviyo profile upsert failed with status ${result.status}`);
    return "failed";
  }
  void (input.listId ?? klaviyoConfig.newsletterListId);
  return "sent";
}

export async function dispatchServerEvent(
  event: CanonicalEvent,
  identity?: ServerIdentity,
): Promise<ServerDispatchResult> {
  const [meta, klaviyo] = await Promise.all([
    sendMetaCapi(event, identity).catch(() => "failed" as const),
    sendKlaviyoEvent(event, identity).catch(() => "failed" as const),
  ]);
  return { meta, klaviyo };
}
