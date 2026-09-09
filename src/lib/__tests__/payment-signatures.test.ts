import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  parseStripeSignatureHeader,
  razorpayCallbackSignature,
  verifyRazorpayCallback,
  verifyRazorpayWebhook,
  verifyStripeWebhook,
} from "@/payments/signatures";

// Synthetic local secrets only — no real credentials are used anywhere here.
const RZP_SECRET = "test_rzp_secret";
const RZP_WEBHOOK = "test_rzp_webhook";
const STRIPE_WEBHOOK = "whsec_test_local";

describe("razorpay signatures", () => {
  it("accepts a correctly signed checkout handshake", () => {
    const signature = razorpayCallbackSignature("order_1", "pay_1", RZP_SECRET);
    expect(
      verifyRazorpayCallback({ orderId: "order_1", paymentId: "pay_1", signature }, RZP_SECRET),
    ).toBe(true);
  });

  it("rejects a tampered handshake or missing secret", () => {
    const signature = razorpayCallbackSignature("order_1", "pay_1", RZP_SECRET);
    expect(
      verifyRazorpayCallback({ orderId: "order_2", paymentId: "pay_1", signature }, RZP_SECRET),
    ).toBe(false);
    expect(verifyRazorpayCallback({ orderId: "order_1", paymentId: "pay_1", signature }, "")).toBe(
      false,
    );
  });

  it("verifies webhook bodies against the webhook secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const signature = createHmac("sha256", RZP_WEBHOOK).update(body).digest("hex");
    expect(verifyRazorpayWebhook(body, signature, RZP_WEBHOOK)).toBe(true);
    expect(verifyRazorpayWebhook(`${body} `, signature, RZP_WEBHOOK)).toBe(false);
  });
});

describe("stripe signatures", () => {
  const body = JSON.stringify({ id: "evt_1", type: "payment_intent.succeeded" });
  const now = 1_700_000_000;

  function header(timestamp: number, secret = STRIPE_WEBHOOK) {
    const v1 = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    return `t=${timestamp},v1=${v1}`;
  }

  it("parses the signature header", () => {
    expect(parseStripeSignatureHeader(header(now))?.timestamp).toBe(String(now));
    expect(parseStripeSignatureHeader("nonsense")).toBeNull();
  });

  it("accepts a fresh, correctly signed payload", () => {
    expect(verifyStripeWebhook(body, header(now), STRIPE_WEBHOOK, { nowSeconds: now })).toBe(true);
  });

  it("rejects replays outside the tolerance window", () => {
    expect(verifyStripeWebhook(body, header(now - 3600), STRIPE_WEBHOOK, { nowSeconds: now })).toBe(
      false,
    );
  });

  it("rejects a wrong secret or missing configuration", () => {
    expect(
      verifyStripeWebhook(body, header(now, "whsec_other"), STRIPE_WEBHOOK, { nowSeconds: now }),
    ).toBe(false);
    expect(verifyStripeWebhook(body, header(now), "", { nowSeconds: now })).toBe(false);
  });
});
