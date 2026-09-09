/**
 * PAYMENT PROVIDER CONTRACT (provider-neutral)
 *
 * Razorpay is the intended primary provider, Stripe the secondary. Both are
 * implemented as server-only adapters behind this interface so the checkout UI
 * never learns which one is in use. With no credentials present every adapter
 * returns `not-configured` — it never pretends a payment succeeded.
 */

import type { Money } from "@/data/types";

export type PaymentProviderName = "razorpay" | "stripe";

export type PaymentState =
  | "not_configured"
  | "requires_action"
  | "pending"
  | "authorized"
  | "captured"
  | "failed"
  | "cancelled"
  | "refund_pending"
  | "refunded";

export type PaymentIntentResult =
  | {
      status: "created";
      provider: PaymentProviderName;
      /** Provider order/intent id — safe to hand to the browser SDK. */
      providerReference: string;
      /** Publishable/client key only. Secrets never leave the server. */
      publicKey: string;
      amount: Money;
      /** Extra client-safe fields the browser SDK needs (never secrets). */
      clientFields?: Record<string, string>;
    }
  | { status: "not-configured"; provider: PaymentProviderName; reason: string }
  | { status: "error"; provider: PaymentProviderName; reason: string };

export type VerificationResult =
  | { valid: true; state: PaymentState; providerReference: string }
  | { valid: false; reason: string };

export type NormalizedWebhookEvent = {
  provider: PaymentProviderName;
  /** Provider event id — used for idempotent processing. */
  eventId: string;
  type: string;
  state: PaymentState;
  providerReference: string;
  orderReference?: string;
  amount?: Money;
  occurredAt: string;
};

export type RefundResult =
  | { status: "requested"; refundReference: string }
  | { status: "not-configured"; reason: string }
  | { status: "error"; reason: string };

export interface PaymentAdapter {
  readonly provider: PaymentProviderName;
  /** True only when every secret this adapter needs is present. */
  isConfigured(): boolean;
  createIntent(input: {
    amount: Money;
    orderReference: string;
    idempotencyKey: string;
    customer?: { name?: string | undefined; email?: string | undefined; phone?: string | undefined } | undefined;
  }): Promise<PaymentIntentResult>;
  /** Verify a browser-returned payment handshake. */
  verifyCallback(payload: Record<string, string>): Promise<VerificationResult>;
  /** Verify + normalize a raw webhook body. */
  parseWebhook(rawBody: string, headers: Record<string, string>): Promise<NormalizedWebhookEvent | null>;
  requestRefund(input: { providerReference: string; amount?: Money; reason?: string }): Promise<RefundResult>;
}
