/**
 * RAZORPAY ADAPTER — server only. Reads secrets inside methods, never at
 * module scope, and fails closed when they are absent.
 */

import type { Money } from "@/data/types";

import { verifyRazorpayCallback, verifyRazorpayWebhook } from "./signatures";
import type {
  NormalizedWebhookEvent,
  PaymentAdapter,
  PaymentIntentResult,
  PaymentState,
  RefundResult,
  VerificationResult,
} from "./types";

const API = "https://api.razorpay.com/v1";

function creds() {
  return {
    keyId: process.env["RAZORPAY_KEY_ID"] ?? "",
    keySecret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
    webhookSecret: process.env["RAZORPAY_WEBHOOK_SECRET"] ?? "",
  };
}

export function mapRazorpayState(raw: string): PaymentState {
  switch (raw) {
    case "created":
      return "pending";
    case "authorized":
      return "authorized";
    case "captured":
      return "captured";
    case "refunded":
      return "refunded";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

export const razorpayAdapter: PaymentAdapter = {
  provider: "razorpay",

  isConfigured() {
    const { keyId, keySecret } = creds();
    return Boolean(keyId && keySecret);
  },

  async createIntent({ amount, orderReference, idempotencyKey }): Promise<PaymentIntentResult> {
    const { keyId, keySecret } = creds();
    if (!keyId || !keySecret) {
      return {
        status: "not-configured",
        provider: "razorpay",
        reason: "Razorpay keys are not configured for this environment.",
      };
    }
    try {
      const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          "x-payment-idempotency": idempotencyKey,
        },
        body: JSON.stringify({
          // Razorpay works in the smallest currency unit.
          amount: Math.round(amount.amount * 100),
          currency: amount.currency,
          receipt: orderReference,
          notes: { orderReference, idempotencyKey },
        }),
      });
      if (!response.ok) {
        return {
          status: "error",
          provider: "razorpay",
          reason: `Razorpay responded ${response.status}.`,
        };
      }
      const payload = (await response.json()) as { id: string };
      return {
        status: "created",
        provider: "razorpay",
        providerReference: payload.id,
        publicKey: keyId,
        amount,
        clientFields: { orderId: payload.id },
      };
    } catch {
      return { status: "error", provider: "razorpay", reason: "Could not reach Razorpay." };
    }
  },

  async verifyCallback(payload): Promise<VerificationResult> {
    const { keySecret } = creds();
    if (!keySecret) return { valid: false, reason: "Razorpay is not configured." };
    const orderId = payload["razorpay_order_id"] ?? "";
    const paymentId = payload["razorpay_payment_id"] ?? "";
    const signature = payload["razorpay_signature"] ?? "";
    if (!orderId || !paymentId || !signature)
      return { valid: false, reason: "Incomplete payment response." };
    const ok = verifyRazorpayCallback({ orderId, paymentId, signature }, keySecret);
    return ok
      ? { valid: true, state: "authorized", providerReference: paymentId }
      : { valid: false, reason: "Payment signature could not be verified." };
  },

  async parseWebhook(rawBody, headers): Promise<NormalizedWebhookEvent | null> {
    const { webhookSecret } = creds();
    const signature = headers["x-razorpay-signature"] ?? "";
    if (!webhookSecret || !verifyRazorpayWebhook(rawBody, signature, webhookSecret)) return null;

    const event = JSON.parse(rawBody) as {
      event: string;
      created_at?: number;
      payload?: {
        payment?: {
          entity?: {
            id: string;
            status: string;
            amount: number;
            currency: string;
            notes?: Record<string, string>;
          };
        };
      };
    };
    const entity = event.payload?.payment?.entity;
    if (!entity) return null;

    const amount: Money = {
      amount: entity.amount / 100,
      currency: (entity.currency as Money["currency"]) ?? "INR",
    };

    return {
      provider: "razorpay",
      eventId: `${event.event}:${entity.id}`,
      type: event.event,
      state: mapRazorpayState(entity.status),
      providerReference: entity.id,
      ...(entity.notes?.["orderReference"]
        ? { orderReference: entity.notes["orderReference"] }
        : {}),
      amount,
      occurredAt: new Date(
        (event.created_at ?? Math.floor(Date.now() / 1000)) * 1000,
      ).toISOString(),
    };
  },

  async requestRefund({ providerReference, amount }): Promise<RefundResult> {
    const { keyId, keySecret } = creds();
    if (!keyId || !keySecret)
      return { status: "not-configured", reason: "Razorpay keys are not configured." };
    try {
      const response = await fetch(
        `${API}/payments/${encodeURIComponent(providerReference)}/refund`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          },
          body: JSON.stringify(amount ? { amount: Math.round(amount.amount * 100) } : {}),
        },
      );
      if (!response.ok)
        return { status: "error", reason: `Razorpay responded ${response.status}.` };
      const payload = (await response.json()) as { id: string };
      return { status: "requested", refundReference: payload.id };
    } catch {
      return { status: "error", reason: "Could not reach Razorpay." };
    }
  },
};
