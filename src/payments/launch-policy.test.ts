import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { paymentLaunchPolicy } from "./launch-policy";
import { verifyIncomingWebhook } from "./webhook-verification.server";

const body = JSON.stringify({ id: "evt_synthetic_1", event: "payment.captured" });
const secret = "synthetic-test-only-key";

describe("payment launch safety", () => {
  it("never activates public payments merely because gateway credentials exist", () => {
    expect(paymentLaunchPolicy.operational).toBe(false);
  });

  it("checks Razorpay raw-body HMAC only through its own header", () => {
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyIncomingWebhook("razorpay", body, { razorpay: signature }, secret)).toBe(true);
    expect(verifyIncomingWebhook("razorpay", body, { stripe: signature }, secret)).toBe(false);
    const changedBody = body + " ";
    expect(verifyIncomingWebhook("razorpay", changedBody, { razorpay: signature }, secret)).toBe(
      false,
    );
  });

  it("checks Stripe timestamped v1 signatures and rejects the wrong protocol", () => {
    const timestamp = 1_700_000_000;
    const signature = createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
    const stripe = `t=${timestamp},v1=${signature}`;
    const now = Math.floor(Date.now() / 1000);
    const currentSignature = createHmac("sha256", secret).update(`${now}.${body}`).digest("hex");
    const current = `t=${now},v1=${currentSignature}`;
    expect(verifyIncomingWebhook("stripe", body, { stripe }, secret)).toBe(false);
    expect(verifyIncomingWebhook("stripe", body, { stripe: current }, secret)).toBe(true);
    expect(verifyIncomingWebhook("stripe", body, { razorpay: current }, secret)).toBe(false);
    expect(verifyIncomingWebhook("stripe", body + "tampered", { stripe: current }, secret)).toBe(
      false,
    );
  });
});
