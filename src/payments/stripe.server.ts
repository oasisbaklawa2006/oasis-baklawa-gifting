/**
 * STRIPE ADAPTER — server only, secondary provider. Same contract as Razorpay,
 * different signing semantics. Fails closed without credentials.
 */

import type { Money } from "@/data/types";

import { verifyStripeWebhook } from "./signatures";
import type {
  NormalizedWebhookEvent,
  PaymentAdapter,
  PaymentIntentResult,
  PaymentState,
  RefundResult,
  VerificationResult,
} from "./types";

const API = "https://api.stripe.com/v1";

function creds() {
  return {
    secretKey: process.env["STRIPE_SECRET_KEY"] ?? "",
    publishableKey: process.env["STRIPE_PUBLISHABLE_KEY"] ?? "",
    webhookSecret: process.env["STRIPE_WEBHOOK_SECRET"] ?? "",
  };
}

export function mapStripeState(raw: string): PaymentState {
  switch (raw) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "requires_action";
    case "processing":
      return "pending";
    case "requires_capture":
      return "authorized";
    case "succeeded":
      return "captured";
    case "canceled":
      return "cancelled";
    default:
      return "pending";
  }
}

export const stripeAdapter: PaymentAdapter = {
  provider: "stripe",

  isConfigured() {
    const { secretKey, publishableKey } = creds();
    return Boolean(secretKey && publishableKey);
  },

  async createIntent({ amount, orderReference, idempotencyKey }): Promise<PaymentIntentResult> {
    const { secretKey, publishableKey } = creds();
    if (!secretKey || !publishableKey) {
      return {
        status: "not-configured",
        provider: "stripe",
        reason: "Stripe keys are not configured for this environment.",
      };
    }
    try {
      const body = new URLSearchParams({
        amount: String(Math.round(amount.amount * 100)),
        currency: amount.currency.toLowerCase(),
        "automatic_payment_methods[enabled]": "true",
        "metadata[orderReference]": orderReference,
      });
      const response = await fetch(`${API}/payment_intents`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secretKey}`,
          "content-type": "application/x-www-form-urlencoded",
          "Idempotency-Key": idempotencyKey,
        },
        body,
      });
      if (!response.ok) {
        return { status: "error", provider: "stripe", reason: `Stripe responded ${response.status}.` };
      }
      const payload = (await response.json()) as { id: string; client_secret: string };
      return {
        status: "created",
        provider: "stripe",
        providerReference: payload.id,
        publicKey: publishableKey,
        amount,
        // client_secret is designed to be client-side; the API secret never is.
        clientFields: { clientSecret: payload.client_secret },
      };
    } catch {
      return { status: "error", provider: "stripe", reason: "Could not reach Stripe." };
    }
  },

  async verifyCallback(payload): Promise<VerificationResult> {
    const { secretKey } = creds();
    if (!secretKey) return { valid: false, reason: "Stripe is not configured." };
    const intentId = payload["payment_intent"] ?? "";
    if (!intentId) return { valid: false, reason: "Incomplete payment response." };
    try {
      // Stripe has no browser HMAC handshake: the server re-reads the intent.
      const response = await fetch(`${API}/payment_intents/${encodeURIComponent(intentId)}`, {
        headers: { authorization: `Bearer ${secretKey}` },
      });
      if (!response.ok) return { valid: false, reason: "Payment could not be confirmed." };
      const intent = (await response.json()) as { id: string; status: string };
      const state = mapStripeState(intent.status);
      if (state !== "captured" && state !== "authorized") {
        return { valid: false, reason: "Payment was not completed." };
      }
      return { valid: true, state, providerReference: intent.id };
    } catch {
      return { valid: false, reason: "Could not reach Stripe." };
    }
  },

  async parseWebhook(rawBody, headers): Promise<NormalizedWebhookEvent | null> {
    const { webhookSecret } = creds();
    const header = headers["stripe-signature"] ?? "";
    if (!webhookSecret || !verifyStripeWebhook(rawBody, header, webhookSecret)) return null;

    const event = JSON.parse(rawBody) as {
      id: string;
      type: string;
      created?: number;
      data?: {
        object?: {
          id: string;
          status: string;
          amount?: number;
          currency?: string;
          metadata?: Record<string, string>;
        };
      };
    };
    const object = event.data?.object;
    if (!object) return null;

    const amount: Money | undefined =
      typeof object.amount === "number"
        ? { amount: object.amount / 100, currency: (object.currency?.toUpperCase() as Money["currency"]) ?? "INR" }
        : undefined;

    return {
      provider: "stripe",
      eventId: event.id,
      type: event.type,
      state: mapStripeState(object.status),
      providerReference: object.id,
      ...(object.metadata?.["orderReference"] ? { orderReference: object.metadata["orderReference"] } : {}),
      ...(amount ? { amount } : {}),
      occurredAt: new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
    };
  },

  async requestRefund({ providerReference, amount }): Promise<RefundResult> {
    const { secretKey } = creds();
    if (!secretKey) return { status: "not-configured", reason: "Stripe keys are not configured." };
    try {
      const body = new URLSearchParams({ payment_intent: providerReference });
      if (amount) body.set("amount", String(Math.round(amount.amount * 100)));
      const response = await fetch(`${API}/refunds`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${secretKey}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
      if (!response.ok) return { status: "error", reason: `Stripe responded ${response.status}.` };
      const payload = (await response.json()) as { id: string };
      return { status: "requested", refundReference: payload.id };
    } catch {
      return { status: "error", reason: "Could not reach Stripe." };
    }
  },
};
