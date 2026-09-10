/**
 * SERVER-ISSUED CART RECOVERY TOKENS (server-only)
 *
 * A recovery link carries a signed, expiring token — never prices, order
 * references, contact details or any secret. The token encodes only the cart
 * id and the public product/variant/quantity selection, so the restored cart
 * is always re-priced and re-validated server-side before checkout.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export type RecoveryLine = { productId: string; variantId: string; quantity: number };

export type RecoveryPayload = {
  cartId: string;
  lines: RecoveryLine[];
  /** Epoch seconds. */
  exp: number;
  /** Rotation nonce — a reissued link invalidates nothing but is never reused. */
  nonce: string;
};

/**
 * Signing key. A configured secret survives restarts; without one a random
 * per-process key is used, so links simply expire on redeploy rather than
 * being signed with a guessable value.
 */
let ephemeralKey: string | null = null;
function signingKey(): string {
  const configured = (process.env["CART_RECOVERY_SECRET"] ?? "").trim();
  if (configured) return configured;
  ephemeralKey = ephemeralKey ?? randomBytes(32).toString("hex");
  return ephemeralKey;
}

export const RECOVERY_TTL_DAYS = 7;

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export function issueRecoveryToken(
  cartId: string,
  lines: RecoveryLine[],
  now = new Date(),
): string {
  const payload: RecoveryPayload = {
    cartId,
    lines: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: Math.max(1, Math.min(99, Math.trunc(line.quantity))),
    })),
    exp: Math.floor(now.getTime() / 1000) + RECOVERY_TTL_DAYS * 86_400,
    nonce: randomBytes(8).toString("hex"),
  };
  const body = b64url(JSON.stringify(payload));
  const signature = b64url(createHmac("sha256", signingKey()).update(body).digest());
  return `${body}.${signature}`;
}

export type VerifyResult =
  | { ok: true; payload: RecoveryPayload }
  | { ok: false; reason: "malformed" | "invalid-signature" | "expired" };

export function verifyRecoveryToken(token: string, now = new Date()): VerifyResult {
  const [body, signature] = token.split(".");
  if (!body || !signature) return { ok: false, reason: "malformed" };

  const expected = b64url(createHmac("sha256", signingKey()).update(body).digest());
  const given = Buffer.from(signature);
  const want = Buffer.from(expected);
  if (given.length !== want.length || !timingSafeEqual(given, want)) {
    return { ok: false, reason: "invalid-signature" };
  }

  let payload: RecoveryPayload;
  try {
    payload = JSON.parse(fromB64url(body).toString("utf8")) as RecoveryPayload;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!payload.cartId || !Array.isArray(payload.lines)) return { ok: false, reason: "malformed" };
  if (payload.exp * 1000 < now.getTime()) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}
