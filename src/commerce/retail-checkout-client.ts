/**
 * Typed client for Core's retail (B2C) checkout (`retail-checkout` edge function).
 *
 * STATUS: pending owner approval of the remaining retail settings, SANDBOX payments only, NOT WIRED to the checkout
 * route (the launch hold stays). Every commercial call, including price display, is refused locally unless a fresh, approved Core
 * readiness answer allows that action (see `decideRetailAction`); Core re-checks everything server-side regardless.
 *
 * The client holds no price, tax rate, fee or policy value: GST-inclusive amounts come only from Core responses.
 */
import { z } from "zod";

import { decideRetailAction, type RetailAction } from "./retail-readiness";

const money = z.number().finite();
const tax = z.object({ cgst: money, sgst: money, igst: money });

export const quoteSchema = z.object({
  quoteId: z.string().uuid(),
  currency: z.literal("INR"),
  priceDisplayMode: z.literal("inclusive"),
  lines: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
      hsn: z.string(),
      unitPriceInclusive: money,
      gstRatePercent: money,
      lineTotalInclusive: money,
      taxableValue: money,
      tax,
    }),
  ),
  shipping: z.object({ feeInclusive: money, gstRatePercent: money, taxableValue: money, tax }),
  totals: z.object({
    inclusiveTotal: money,
    taxableTotal: money,
    taxTotal: money,
    cgst: money,
    sgst: money,
    igst: money,
    supply: z.enum(["intra_state", "inter_state"]),
  }),
  expiresAt: z.string(),
  replayed: z.boolean().optional(),
});
export type RetailQuote = z.infer<typeof quoteSchema>;

export const orderSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["pending_payment", "paid", "cancelled"]),
  totalInr: money,
  reservationExpiresAt: z.string(),
  stockReservationEnforced: z.literal(false),
  replayed: z.boolean().optional(),
});
export type RetailOrder = z.infer<typeof orderSchema>;

export const paymentIntentSchema = z.object({
  keyId: z.string().startsWith("rzp_test_"), // sandbox only: a live key id is treated as an invalid response
  razorpayOrderId: z.string().regex(/^order_[A-Za-z0-9]{6,40}$/),
  amountPaise: z.number().int().positive(),
  currency: z.literal("INR"),
});
export type RetailPaymentIntent = z.infer<typeof paymentIntentSchema>;

export const sessionSchema = z.object({
  sessionToken: z.string().regex(/^rsess_[0-9a-f]{64}$/),
  expiresAt: z.string(),
});

export const priceDisplaySchema = z.object({
  priceDisplayMode: z.literal("inclusive"),
  currency: z.literal("INR"),
  items: z.array(
    z.discriminatedUnion("available", [
      z.object({
        productId: z.string().uuid(),
        available: z.literal(true),
        unitPriceInclusive: money,
        gstRatePercent: money,
        taxIncludedPerUnit: money,
      }),
      z.object({ productId: z.string().uuid(), available: z.literal(false), reason: z.string() }),
    ]),
  ),
});
export type RetailPriceDisplay = z.infer<typeof priceDisplaySchema>;

export type RetailCall<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      /** `blocked` = refused locally because readiness does not allow the action; no request was sent. */
      kind: "blocked" | "http" | "network" | "invalid_response";
      status?: number;
      error?: string;
    };

export type RetailCheckoutClientOptions = {
  /** e.g. https://<project>.supabase.co/functions/v1/retail-checkout */
  baseUrl: string;
  fetchImpl?: typeof fetch;
  /** Latest readiness answer from Core (never cached by this client). */
  readiness: () => unknown;
  now?: () => Date;
  timeoutMs?: number;
};

export function createRetailCheckoutClient(options: RetailCheckoutClientOptions) {
  const doFetch = options.fetchImpl ?? fetch;

  async function send<T>(
    route: string,
    body: unknown,
    schema: z.ZodType<T>,
    gate: RetailAction | null,
    sessionToken?: string,
  ): Promise<RetailCall<T>> {
    if (gate) {
      const decision = decideRetailAction(
        gate,
        options.readiness(),
        options.now ? { now: options.now() } : {},
      );
      if (!decision.allowed) return { ok: false, kind: "blocked", error: decision.reason };
    }
    try {
      const res = await doFetch(`${options.baseUrl.replace(/\/$/, "")}/${route}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(sessionToken ? { authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(options.timeoutMs ?? 15_000),
      });
      const json: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const error = (json as { error?: unknown } | null)?.error;
        return typeof error === "string"
          ? { ok: false, kind: "http", status: res.status, error }
          : { ok: false, kind: "http", status: res.status };
      }
      const parsed = schema.safeParse(json);
      return parsed.success
        ? { ok: true, data: parsed.data }
        : { ok: false, kind: "invalid_response", status: res.status };
    } catch {
      return { ok: false, kind: "network" };
    }
  }

  return {
    /** `accessToken` is the MSG91 widget access token; the phone itself never reaches this client. */
    startSession: (accessToken: string) => send("session", { accessToken }, sessionSchema, "order"),
    priceDisplay: (productIds: string[]) =>
      send("price-display", { productIds }, priceDisplaySchema, "quote"),
    quote: (sessionToken: string, request: unknown) =>
      send("quote", request, quoteSchema, "quote", sessionToken),
    order: (sessionToken: string, quoteId: string, idempotencyKey: string) =>
      send("order", { quoteId, idempotencyKey }, orderSchema, "order", sessionToken),
    paymentIntent: (sessionToken: string, orderId: string) =>
      send("payment-intent", { orderId }, paymentIntentSchema, "payment", sessionToken),
  };
}

/** Options for Razorpay Checkout, built only from a validated sandbox intent. */
export function razorpayCheckoutOptions(intent: RetailPaymentIntent) {
  return {
    key: intent.keyId,
    order_id: intent.razorpayOrderId,
    amount: intent.amountPaise,
    currency: intent.currency,
  } as const;
}

const inr = (n: number) =>
  `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** GST-inclusive display text from Core-provided numbers only. */
export function describeInclusivePrice(
  unitPriceInclusive: number,
  taxIncludedPerUnit: number,
): string {
  return `${inr(unitPriceInclusive)} (inclusive of GST ${inr(taxIncludedPerUnit)})`;
}
