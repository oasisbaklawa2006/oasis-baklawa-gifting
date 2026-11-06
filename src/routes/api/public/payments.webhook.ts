/**
 * Website payment webhook boundary.
 *
 * Verify provider-specific signatures before parsing or storing any event.
 * Until Core order authority and an atomic retryable delivery ledger are
 * certified, return 503. A valid signature is NOT a completed payment handoff.
 * Do not acknowledge events with 2xx and silently lose them.
 */
import { createFileRoute } from "@tanstack/react-router";

import { paymentLaunchPolicy } from "@/payments/launch-policy";

const MAX_BODY_BYTES = 256 * 1024;

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provider = (process.env["PAYMENT_PROVIDER"] ?? "").trim();
        if (provider !== "razorpay" && provider !== "stripe") {
          return new Response("Payment webhook not configured", { status: 503 });
        }

        const secret =
          provider === "razorpay"
            ? process.env["RAZORPAY_WEBHOOK_SECRET"]
            : process.env["STRIPE_WEBHOOK_SECRET"];

        if (!secret) return new Response("Payment webhook not configured", { status: 503 });

        const declaredLength = Number(request.headers.get("content-length") ?? "0");
        if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const body = await request.text();
        if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
          return new Response("Payload too large", { status: 413 });
        }

        const { verifyIncomingWebhook } = await import(
          "@/payments/webhook-verification.server"
        );
        const verified = verifyIncomingWebhook(
          provider,
          body,
          {
            razorpay: request.headers.get("x-razorpay-signature"),
            stripe: request.headers.get("stripe-signature"),
          },
          secret,
        );
        if (!verified) return new Response("Invalid signature", { status: 401 });

        // Deliberate release gate: the existing webhook ledger cannot safely
        // re-claim failed forwards. Do not insert, forward or acknowledge until
        // a verified idempotent Core handoff and retry claim are implemented.
        return Response.json(
          { received: false, status: "unavailable", reason: paymentLaunchPolicy.reason },
          {
            status: 503,
            headers: {
              "cache-control": "no-store",
              "retry-after": "3600",
            },
          },
        );
      },
    },
  },
});
