/**
 * INBOUND WEBHOOK GATEWAY
 *
 * One typed path for every provider event: payment, shipment, message
 * delivery, review and CRM. A provider that supports signing may never be
 * accepted unsigned in production, replays are rejected by event id, and
 * anything that cannot be processed lands in a dead-letter record.
 */

import { registerAdapter } from "./registry";

export type WebhookSource =
  "payment" | "shipping" | "communications" | "reviews" | "crm" | "commerce";

export type InboundWebhook = {
  source: WebhookSource;
  provider: string;
  /** Provider's own event id; used for the replay guard. */
  eventId: string;
  receivedAt: string;
  signature?: string;
  rawBody: string;
};

export type NormalizedWebhook = {
  source: WebhookSource;
  provider: string;
  eventId: string;
  type: string;
  occurredAt: string;
  payload: Record<string, unknown>;
};

export type WebhookOutcome =
  | { status: "accepted"; event: NormalizedWebhook }
  | { status: "duplicate" }
  | { status: "rejected"; reason: "missing_signature" | "invalid_signature" | "unparsable" };

/** Providers that always sign. An unsigned request from these is rejected. */
export const SIGNED_SOURCES: Record<string, boolean> = {
  razorpay: true,
  stripe: true,
  shiprocket: false,
  delhivery: false,
  resend: true,
  sendgrid: true,
  meta_whatsapp: true,
  judgeme: false,
  hubspot: true,
};

export function requiresSignature(provider: string): boolean {
  return SIGNED_SOURCES[provider] === true;
}

const seen = new Map<string, string>();
const deadLetters: Array<InboundWebhook & { reason: string }> = [];

export function isReplay(provider: string, eventId: string): boolean {
  return seen.has(`${provider}:${eventId}`);
}

export function receiveWebhook(
  inbound: InboundWebhook,
  verify: (inbound: InboundWebhook) => boolean,
): WebhookOutcome {
  if (requiresSignature(inbound.provider) && !inbound.signature) {
    deadLetters.push({ ...inbound, reason: "missing_signature" });
    return { status: "rejected", reason: "missing_signature" };
  }
  if (inbound.signature && !verify(inbound)) {
    deadLetters.push({ ...inbound, reason: "invalid_signature" });
    return { status: "rejected", reason: "invalid_signature" };
  }
  if (isReplay(inbound.provider, inbound.eventId)) return { status: "duplicate" };

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(inbound.rawBody) as Record<string, unknown>;
  } catch {
    deadLetters.push({ ...inbound, reason: "unparsable" });
    return { status: "rejected", reason: "unparsable" };
  }

  seen.set(`${inbound.provider}:${inbound.eventId}`, inbound.receivedAt);
  return {
    status: "accepted",
    event: {
      source: inbound.source,
      provider: inbound.provider,
      eventId: inbound.eventId,
      type: String(payload["type"] ?? payload["event"] ?? "unknown"),
      occurredAt: String(payload["created_at"] ?? inbound.receivedAt),
      payload,
    },
  };
}

export function deadLetterQueue(): Array<InboundWebhook & { reason: string }> {
  return [...deadLetters];
}

registerAdapter({
  id: "webhooks:gateway",
  domain: "webhooks",
  provider: "gateway",
  label: "Inbound webhook gateway",
  capabilities: [
    "signature-contract",
    "idempotency",
    "replay-guard",
    "normalisation",
    "dead-letter",
  ],
  requiredEnv: [],
  fallback: "Always available; unsigned events from signing providers are rejected.",
  isFallback: true,
});

/** Test helper. */
export function resetWebhooks(): void {
  seen.clear();
  deadLetters.length = 0;
}
