/**
 * Provider-specific signature verification. Razorpay and Stripe sign
 * differently, so they get different verifiers — never one generic HMAC.
 * These are pure functions taking the secret explicitly so they can be tested
 * with synthetic fixtures and no real credentials.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/* ------------------------------- Razorpay ------------------------------- */

/** Checkout handshake: HMAC-SHA256 of `${order_id}|${payment_id}` in hex. */
export function razorpayCallbackSignature(orderId: string, paymentId: string, keySecret: string): string {
  return createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
}

export function verifyRazorpayCallback(
  input: { orderId: string; paymentId: string; signature: string },
  keySecret: string,
): boolean {
  if (!keySecret || !input.signature) return false;
  return safeEqualHex(razorpayCallbackSignature(input.orderId, input.paymentId, keySecret), input.signature);
}

/** Webhook: HMAC-SHA256 of the raw body, hex, in `x-razorpay-signature`. */
export function verifyRazorpayWebhook(rawBody: string, signature: string, webhookSecret: string): boolean {
  if (!webhookSecret || !signature) return false;
  const expected = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  return safeEqualHex(expected, signature);
}

/* -------------------------------- Stripe -------------------------------- */

export type StripeSignatureHeader = { timestamp: string; signatures: string[] };

export function parseStripeSignatureHeader(header: string): StripeSignatureHeader | null {
  if (!header) return null;
  let timestamp = "";
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=");
    if (!key || !value) continue;
    if (key === "t") timestamp = value;
    if (key === "v1") signatures.push(value);
  }
  if (!timestamp || signatures.length === 0) return null;
  return { timestamp, signatures };
}

export function stripeSignaturePayload(timestamp: string, rawBody: string): string {
  return `${timestamp}.${rawBody}`;
}

/**
 * Stripe webhook: HMAC-SHA256 of `${timestamp}.${rawBody}` with the endpoint
 * secret, compared against any `v1` entry, with a replay window.
 */
export function verifyStripeWebhook(
  rawBody: string,
  header: string,
  endpointSecret: string,
  options: { toleranceSeconds?: number; nowSeconds?: number } = {},
): boolean {
  if (!endpointSecret) return false;
  const parsed = parseStripeSignatureHeader(header);
  if (!parsed) return false;

  const tolerance = options.toleranceSeconds ?? 300;
  const now = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  const sent = Number(parsed.timestamp);
  if (!Number.isFinite(sent) || Math.abs(now - sent) > tolerance) return false;

  const expected = createHmac("sha256", endpointSecret)
    .update(stripeSignaturePayload(parsed.timestamp, rawBody))
    .digest("hex");

  return parsed.signatures.some((candidate) => safeEqualHex(expected, candidate));
}
