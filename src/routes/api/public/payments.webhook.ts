/**
 * Signed payment webhook receiver.
 *
 * Fails closed: without a configured shared secret nothing is processed, and
 * an unsigned or mis-signed request is rejected before the body is read as
 * data. Order truth is owned by Oasis Central — this endpoint only forwards a
 * verified, idempotent event.
 */

import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PAYMENT_WEBHOOK_SECRET"];
        if (!secret) {
          return new Response(JSON.stringify({ error: "Webhook not configured" }), {
            status: 503,
            headers: { "content-type": "application/json" },
          });
        }

        const signature =
          request.headers.get("x-razorpay-signature") ??
          request.headers.get("stripe-signature") ??
          request.headers.get("x-oasis-signature");
        const body = await request.text();

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        if (!signature || !safeEqual(signature, expected)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: { id?: string; event?: string } = {};
        try {
          event = JSON.parse(body) as { id?: string; event?: string };
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        // Durable replay guard: the same provider event is only ever handled once.
        const eventId = event.id ?? expected.slice(0, 32);
        if (process.env["SUPABASE_SERVICE_ROLE_KEY"]) {
          const { claimWebhookEvent } = await import("@/lib/persistence/database.server");
          const claim = await claimWebhookEvent({
            provider: "payments",
            eventId,
            ...(event.event ? { eventType: event.event } : {}),
          });
          if (!claim.ok) {
            // Cannot guarantee single handling: ask the provider to retry.
            return new Response("Event store unavailable", { status: 503 });
          }
          if (!claim.fresh) {
            return new Response(JSON.stringify({ received: true, duplicate: true }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
        }

        const forwardUrl = process.env["APPVERSE_BASE_URL"];
        if (!forwardUrl) {
          // Verified but nowhere to hand off yet: acknowledge without inventing state.
          console.warn(
            "Verified payment webhook received with no Central connector configured",
            event.event,
          );
          return new Response(JSON.stringify({ received: true, forwarded: false }), {
            status: 202,
            headers: { "content-type": "application/json" },
          });
        }

        const forwarded = await fetch(`${forwardUrl}/v1/payment-events`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "idempotency-key": event.id ?? expected.slice(0, 32),
          },
          body,
        });

        if (!forwarded.ok) {
          console.error(`Payment event forward failed [${forwarded.status}]`);
          return new Response("Upstream rejected event", { status: 502 });
        }

        return new Response(JSON.stringify({ received: true, forwarded: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
