/**
 * Support / post-purchase ticket boundary.
 *
 * Tickets belong to Oasis Central / CRM, not to the website. When no connector
 * is configured this fails closed and the UI falls back to the published
 * contact channels — it never claims a ticket was raised.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const SUPPORT_REASONS = [
  { id: "delivery", label: "Delivery delay or missing parcel" },
  { id: "damaged", label: "Damaged on arrival" },
  { id: "wrong-item", label: "Wrong item received" },
  { id: "payment", label: "Payment or invoice" },
  { id: "cancellation", label: "Cancellation request" },
  { id: "other", label: "Something else" },
] as const;

export type SupportReasonId = (typeof SUPPORT_REASONS)[number]["id"];

const schema = z.object({
  reason: z.enum(["delivery", "damaged", "wrong-item", "payment", "cancellation", "other"]),
  orderReference: z.string().max(40).optional(),
  name: z.string().min(2).max(80),
  contact: z.string().min(5).max(120),
  message: z.string().min(10).max(1500),
  idempotencyKey: z.string().min(8),
});

export type SupportSubmitResult =
  | { status: "received"; ticketReference: string }
  | { status: "unavailable"; reason: string };

export const submitSupportRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<SupportSubmitResult> => {
    const baseUrl = process.env["APPVERSE_BASE_URL"] ?? process.env["VITE_APPVERSE_BASE_URL"] ?? "";
    if (!baseUrl) {
      return {
        status: "unavailable",
        reason: "We can’t log this request automatically right now — please reach us on the contact details below and we will pick it up straight away.",
      };
    }
    try {
      const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/v1/support-tickets`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": data.idempotencyKey,
        },
        // Privacy-safe payload: only what the team needs to answer.
        body: JSON.stringify({
          reason: data.reason,
          orderReference: data.orderReference ?? null,
          name: data.name,
          contact: data.contact,
          message: data.message,
        }),
      });
      if (!response.ok) {
        return { status: "unavailable", reason: "Our support system didn’t respond. Please use the contact details below." };
      }
      const payload = (await response.json()) as { ticketReference?: string };
      return { status: "received", ticketReference: payload.ticketReference ?? data.idempotencyKey.slice(0, 8) };
    } catch {
      return { status: "unavailable", reason: "We couldn’t reach our support system. Please use the contact details below." };
    }
  });
