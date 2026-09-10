/**
 * COMMUNICATIONS ADAPTER
 *
 * Transactional and lifecycle messaging across email, SMS, WhatsApp and push.
 * Messages are addressed by a stable internal template key; provider template
 * IDs are supplied by configuration later and are never invented here.
 *
 * Transactional messages (order, payment, delivery, OTP) are necessary
 * service communication and are NOT gated by marketing consent. Lifecycle
 * marketing messages are, and must carry `category: "marketing"`.
 */

import { registerAdapter, recordError, recordSuccess, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export const TEMPLATE_KEYS = [
  "order_confirmation",
  "payment_received",
  "payment_failed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refund_issued",
  "otp",
  "cart_recovery",
  "wedding_lead_ack",
  "corporate_lead_ack",
  "newsletter_welcome",
  "review_request",
] as const;

export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

export type MessageChannel = "email" | "sms" | "whatsapp" | "push";

export type MessageCategory = "transactional" | "marketing";

/** Transactional keys are lawful service messages; the rest need consent. */
const MARKETING_TEMPLATES = new Set<TemplateKey>([
  "cart_recovery",
  "newsletter_welcome",
  "review_request",
]);

export function categoryOf(template: TemplateKey): MessageCategory {
  return MARKETING_TEMPLATES.has(template) ? "marketing" : "transactional";
}

export function isTemplateKey(value: string): value is TemplateKey {
  return (TEMPLATE_KEYS as readonly string[]).includes(value);
}

/** Normalises any inbound/legacy key spelling to a known internal key. */
export function normalizeTemplateKey(raw: string): TemplateKey | null {
  const key = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return isTemplateKey(key) ? key : null;
}

export type MessageRequest = {
  channel: MessageChannel;
  template: TemplateKey;
  /** Email address, E.164 phone, or device token depending on channel. */
  to: string;
  /** Values merged into the provider template. Never raw payment data. */
  variables?: Record<string, string | number>;
  /** Caller-supplied idempotency key; retries with the same key must not resend. */
  idempotencyKey: string;
  locale?: string;
};

export type DeliveryState = "queued" | "sent" | "delivered" | "failed" | "suppressed";

export type DeliveryResult = {
  providerMessageId?: string;
  state: DeliveryState;
  detail: string;
};

export interface CommunicationsAdapter {
  readonly provider: string;
  supports(channel: MessageChannel): boolean;
  send(request: MessageRequest): Promise<AdapterResult<DeliveryResult>>;
  /** Normalises a provider delivery webhook into the internal state model. */
  normalizeDeliveryEvent(payload: unknown): DeliveryResult | null;
}

/* ---------------- Local fallback: queue-and-report, never pretend ---------------- */

const sentKeys = new Set<string>();

export const localCommunications: CommunicationsAdapter = {
  provider: "local",
  supports: () => true,
  async send(request) {
    if (sentKeys.has(request.idempotencyKey)) {
      return {
        ok: true,
        provider: "local",
        data: { state: "queued", detail: "Duplicate suppressed by idempotency key." },
      };
    }
    sentKeys.add(request.idempotencyKey);
    // No credentials: the message is recorded as queued, never as delivered.
    return {
      ok: true,
      provider: "local",
      data: {
        state: "queued",
        detail: `Queued ${request.channel}/${request.template}. No messaging provider is configured, so nothing was sent.`,
      },
    };
  },
  normalizeDeliveryEvent: () => null,
};

/* ---------------- Provider boundaries (credential-gated) ---------------- */

const providerBoundary = (
  provider: string,
  label: string,
  channels: MessageChannel[],
  requiredEnv: readonly string[],
): CommunicationsAdapter => ({
  provider,
  supports: (channel) => channels.includes(channel),
  async send() {
    return notConfigured<DeliveryResult>(
      provider,
      `${label} is not configured. Required: ${requiredEnv.join(", ")}.`,
    );
  },
  normalizeDeliveryEvent: (payload) => normalizeGenericDelivery(payload),
});

/** Best-effort mapping used until a provider-specific mapper is written. */
export function normalizeGenericDelivery(payload: unknown): DeliveryResult | null {
  if (!payload || typeof payload !== "object") return null;
  const raw = String(
    (payload as Record<string, unknown>)["status"] ??
      (payload as Record<string, unknown>)["event"] ??
      "",
  ).toLowerCase();
  const map: Record<string, DeliveryState> = {
    queued: "queued",
    accepted: "queued",
    sent: "sent",
    delivered: "delivered",
    read: "delivered",
    bounce: "failed",
    bounced: "failed",
    failed: "failed",
    undelivered: "failed",
    complained: "suppressed",
    unsubscribed: "suppressed",
  };
  const state = map[raw];
  if (!state) return null;
  const id = (payload as Record<string, unknown>)["id"];
  return {
    state,
    detail: raw,
    ...(typeof id === "string" ? { providerMessageId: id } : {}),
  };
}

const boundaries: Record<string, CommunicationsAdapter> = {
  resend: providerBoundary("resend", "Resend email", ["email"], ["RESEND_API_KEY"]),
  ses: providerBoundary(
    "ses",
    "Amazon SES",
    ["email"],
    ["AWS_SES_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  ),
  sendgrid: providerBoundary("sendgrid", "SendGrid", ["email"], ["SENDGRID_API_KEY"]),
  twilio: providerBoundary(
    "twilio",
    "Twilio SMS",
    ["sms"],
    ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SENDER_ID"],
  ),
  msg91: providerBoundary(
    "msg91",
    "MSG91 SMS/OTP (India)",
    ["sms"],
    ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_DLT_TEMPLATE_ID"],
  ),
  meta_whatsapp: providerBoundary(
    "meta_whatsapp",
    "WhatsApp Cloud API (D2C)",
    ["whatsapp"],
    ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
  ),
  gupshup: providerBoundary(
    "gupshup",
    "Gupshup WhatsApp",
    ["whatsapp"],
    ["GUPSHUP_API_KEY", "GUPSHUP_SOURCE_NUMBER"],
  ),
};

registerAdapter({
  id: "communications:local",
  domain: "communications",
  provider: "local",
  label: "Local queue (no send)",
  capabilities: ["queue", "idempotency", "template-keys"],
  requiredEnv: [],
  fallback: "Always available. Records the message and reports it as queued, never as delivered.",
  isFallback: true,
});

const providerMeta: Array<[string, string, readonly string[], readonly string[]]> = [
  ["resend", "Resend (email)", ["email", "delivery-webhook"], ["RESEND_API_KEY"]],
  [
    "ses",
    "Amazon SES (email)",
    ["email"],
    ["AWS_SES_REGION", "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"],
  ],
  ["sendgrid", "SendGrid (email)", ["email", "delivery-webhook"], ["SENDGRID_API_KEY"]],
  [
    "twilio",
    "Twilio (SMS/OTP)",
    ["sms", "otp"],
    ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_SENDER_ID"],
  ],
  [
    "msg91",
    "MSG91 (SMS/OTP, India DLT)",
    ["sms", "otp"],
    ["MSG91_AUTH_KEY", "MSG91_SENDER_ID", "MSG91_DLT_TEMPLATE_ID"],
  ],
  [
    "meta_whatsapp",
    "WhatsApp Cloud API (D2C only)",
    ["whatsapp", "delivery-webhook"],
    ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN"],
  ],
  [
    "gupshup",
    "Gupshup WhatsApp",
    ["whatsapp"],
    ["GUPSHUP_API_KEY", "GUPSHUP_SOURCE_NUMBER"],
  ],
];

for (const [provider, label, capabilities, requiredEnv] of providerMeta) {
  registerAdapter({
    id: `communications:${provider}`,
    domain: "communications",
    provider,
    label,
    capabilities,
    requiredEnv,
    fallback: "Falls back to the local queue; no message is sent.",
  });
}

export function communicationsAdapter(): CommunicationsAdapter {
  const descriptor = resolveAdapter("communications");
  if (!descriptor || descriptor.provider === "local") return localCommunications;
  return boundaries[descriptor.provider] ?? localCommunications;
}

export async function sendMessage(
  request: MessageRequest,
): Promise<AdapterResult<DeliveryResult>> {
  const adapter = communicationsAdapter();
  const id = `communications:${adapter.provider}`;
  if (!adapter.supports(request.channel)) {
    return localCommunications.send(request);
  }
  const result = await adapter.send(request);
  if (result.ok) recordSuccess(id);
  else recordError(id, result.detail);
  return result;
}

/** Test helper. */
export function resetCommunications(): void {
  sentKeys.clear();
}
