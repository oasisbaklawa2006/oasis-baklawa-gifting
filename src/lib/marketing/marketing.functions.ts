/**
 * Server boundary for marketing dispatch.
 *
 * The browser posts the canonical event; the server fans it out to Meta CAPI
 * and Klaviyo with the SAME event id (de-duplication) and hashes any PII.
 * With no credentials configured, every path no-ops and reports "skipped".
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { canonicalEventSchema } from "./events";

const identitySchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().max(24).optional(),
    firstName: z.string().max(80).optional(),
    lastName: z.string().max(80).optional(),
    city: z.string().max(80).optional(),
    postalCode: z.string().max(12).optional(),
    country: z.string().max(56).optional(),
  })
  .optional();

const schema = z.object({
  event: canonicalEventSchema,
  identity: identitySchema,
});

export const dispatchMarketingEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    // Marketing consent is the lawful basis for any server-side dispatch.
    if (!data.event.consent.marketing) {
      return { meta: "skipped" as const, klaviyo: "skipped" as const };
    }
    const { dispatchServerEvent } = await import("./server-events.server");
    return dispatchServerEvent(data.event, data.identity);
  });
