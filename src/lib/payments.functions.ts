/**
 * Public payment server functions deliberately fail closed until an
 * authoritative Oasis Core order/amount contract has passed non-production
 * integration and reconciliation tests. Gateway configuration is not authority.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { paymentLaunchPolicy } from "@/payments/launch-policy";

const moneySchema = z.object({
  amount: z.number().nonnegative(),
  currency: z.enum(["INR", "AED", "USD"]),
});

/** Credentials are configuration diagnostics, not permission to take money. */
export const paymentStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { paymentReadiness } = await import("@/payments/index.server");
  return {
    live: paymentLaunchPolicy.operational,
    provider: null,
    providers: paymentReadiness(),
  };
});

/**
 * The client cannot authorize an amount or invent an orderReference.
 * A verified server-owned order and quote are prerequisites not yet available.
 */
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
  .handler(async () => ({
    status: "not-configured" as const,
    provider: null,
    reason: paymentLaunchPolicy.reason,
  }));

/** A callback cannot certify payment without a verified Core order association. */
export const confirmPayment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ payload: z.record(z.string(), z.string()) }).parse(input),
  )
  .handler(async () => ({
    valid: false as const,
    reason: paymentLaunchPolicy.reason,
  }));
