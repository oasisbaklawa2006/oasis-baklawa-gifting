/**
 * Server boundary for payments. Secrets stay on the server; the browser only
 * ever receives client-safe values. With no provider configured every call
 * returns a clean `not-configured` result rather than a fake success.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.enum(["INR", "AED", "USD"]),
});

/** Which payment provider (if any) the checkout may present as live. */
export const paymentStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { resolvePaymentAdapter, paymentReadiness } = await import("@/payments/index.server");
  const adapter = resolvePaymentAdapter();
  return {
    live: Boolean(adapter),
    provider: adapter?.provider ?? null,
    providers: paymentReadiness(),
  };
});

export const createPaymentIntent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        amount: moneySchema,
        orderReference: z.string().min(3),
        idempotencyKey: z.string().min(8),
        customer: z
          .object({
            name: z.string().optional(),
            email: z.string().email().optional(),
            phone: z.string().optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { resolvePaymentAdapter } = await import("@/payments/index.server");
    const adapter = resolvePaymentAdapter();
    if (!adapter) {
      return {
        status: "not-configured" as const,
        provider: null,
        reason: "Online payment is not available at the moment.",
      };
    }
    const result = await adapter.createIntent({
      amount: data.amount,
      orderReference: data.orderReference,
      idempotencyKey: data.idempotencyKey,
      ...(data.customer ? { customer: data.customer } : {}),
    });
    return result;
  });

export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ payload: z.record(z.string(), z.string()) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { resolvePaymentAdapter } = await import("@/payments/index.server");
    const adapter = resolvePaymentAdapter();
    if (!adapter)
      return { valid: false as const, reason: "Payments are not available at the moment." };
    return adapter.verifyCallback(data.payload);
  });
