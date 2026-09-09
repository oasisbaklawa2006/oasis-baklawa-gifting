/**
 * Server boundary for commerce actions. Totals and order creation happen here,
 * never in the browser. Secrets are read inside handlers only.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { commerce } from "@/commerce";
import { readinessReport } from "@/config/integrations";

const lineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

const orderSchema = z.object({
  lines: z.array(lineSchema).min(1),
  gift: z
    .object({
      message: z.string().max(250).optional(),
      ribbonId: z.string().optional(),
      sealId: z.string().optional(),
      concealInvoice: z.boolean().optional(),
    })
    .optional(),
  deliveryOptionId: z.string().optional(),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(6),
  }),
  shipping: z.object({
    addressLine1: z.string().min(1),
    addressLine2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    pincode: z.string().regex(/^[1-9][0-9]{5}$/),
    country: z.string().min(2),
  }),
  idempotencyKey: z.string().min(8),
});

/** Authoritative cart pricing. */
export const priceCart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ lines: z.array(lineSchema), deliveryOptionId: z.string().optional() }).parse(input),
  )
  .handler(async ({ data }) =>
    commerce.priceCart(
      data.lines,
      data.deliveryOptionId ? { deliveryOptionId: data.deliveryOptionId } : {},
    ),
  );

/** Idempotent order handoff. Fails closed when no connector is configured. */
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      return await commerce.createOrderIntent(data);
    } catch (error) {
      console.error("placeOrder failed", error);
      return { status: "unavailable" as const, reason: "The order service is temporarily unavailable." };
    }
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ reference: z.string().min(3), contact: z.string().min(3) }).parse(input),
  )
  .handler(async ({ data }) => commerce.getOrderStatus(data.reference, data.contact));

/** Integration health for the private status surface. */
export const integrationHealth = createServerFn({ method: "GET" }).handler(async () => {
  const provider = await commerce.health();
  const paymentSecretPresent = Boolean(
    process.env["PAYMENT_PROVIDER_SECRET"] || process.env["RAZORPAY_KEY_SECRET"] || process.env["STRIPE_SECRET_KEY"],
  );
  const webhookSecretPresent = Boolean(process.env["PAYMENT_WEBHOOK_SECRET"]);

  return {
    provider,
    paymentSecretPresent,
    webhookSecretPresent,
    readiness: readinessReport([
      {
        id: "payment-secret",
        group: "Payments",
        label: "Gateway server secret",
        status: paymentSecretPresent ? "configured" : "not-configured",
        requires: "PAYMENT_PROVIDER_SECRET in project secrets",
      },
      {
        id: "payment-webhook",
        group: "Payments",
        label: "Signed payment webhook secret",
        status: webhookSecretPresent ? "configured" : "not-configured",
        requires: "PAYMENT_WEBHOOK_SECRET shared with the gateway dashboard",
      },
    ]),
    generatedAt: new Date().toISOString(),
  };
});
