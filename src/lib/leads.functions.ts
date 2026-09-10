/**
 * ONE TYPED LEAD / SUBSCRIPTION SERVICE
 *
 * Every capture surface (newsletter, contact, corporate, wedding, rewards)
 * calls this. The record is persisted first, then forwarded to Appverse/Central
 * and Klaviyo when those credentials exist. The UI is told exactly what
 * happened — a queued record is reported as queued, never as "sent".
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const LEAD_KINDS = [
  "newsletter",
  "contact",
  "corporate",
  "wedding",
  "rewards",
  "partnership",
] as const;

const schema = z.object({
  kind: z.enum(LEAD_KINDS),
  email: z.string().email().optional(),
  phone: z.string().min(6).max(24).optional(),
  name: z.string().max(120).optional(),
  company: z.string().max(160).optional(),
  message: z.string().max(2000).optional(),
  /** Where on the site the capture happened, e.g. "footer-newsletter". */
  source: z.string().min(2).max(80),
  marketingConsent: z.boolean(),
  /** Approved, non-identifying campaign fields only. */
  attribution: z.record(z.string(), z.string()).max(40).optional(),
  /** Restrained profile properties (occasion, product family, recipient band). */
  properties: z.record(z.string(), z.string()).max(20).optional(),
});

export type LeadInput = z.infer<typeof schema>;

export type LeadResult =
  | { status: "saved"; deduped: boolean; syncState: "pending_sync" | "synced" | "failed" }
  | { status: "invalid"; reason: string };

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }): Promise<LeadResult> => {
    if (!data.email && !data.phone) {
      return { status: "invalid", reason: "An email address or phone number is required." };
    }

    const { dedupeKey, listLeads, markSync, saveLead } = await import("./leads.server");
    const key = dedupeKey(data.kind, data.email, data.phone);
    const deduped = listLeads().some((record) => record.key === key);

    const record = saveLead({
      kind: data.kind,
      ...(data.email ? { email: data.email.trim().toLowerCase() } : {}),
      ...(data.phone ? { phone: data.phone } : {}),
      ...(data.name ? { name: data.name } : {}),
      ...(data.company ? { company: data.company } : {}),
      ...(data.message ? { message: data.message } : {}),
      attribution: data.attribution ?? {},
      consent: { marketing: data.marketingConsent, timestamp: new Date().toISOString() },
      source: data.source,
    });

    let syncState: "pending_sync" | "synced" | "failed" = "pending_sync";

    // 1) Appverse / Central is the operational authority for leads.
    const baseUrl = (
      process.env["APPVERSE_BASE_URL"] ??
      process.env["VITE_APPVERSE_BASE_URL"] ??
      ""
    ).replace(/\/+$/, "");
    if (baseUrl) {
      try {
        const response = await fetch(`${baseUrl}/v1/leads`, {
          method: "POST",
          headers: { "content-type": "application/json", "idempotency-key": record.id },
          body: JSON.stringify({
            kind: record.kind,
            email: record.email ?? null,
            phone: record.phone ?? null,
            name: record.name ?? null,
            company: record.company ?? null,
            message: record.message ?? null,
            source: record.source,
            consent: record.consent,
            attribution: record.attribution,
          }),
        });
        syncState = response.ok ? "synced" : "failed";
      } catch {
        syncState = "failed";
      }
    }

    // 2) Klaviyo profile, only with marketing consent.
    if (data.marketingConsent) {
      try {
        const { upsertKlaviyoProfile } = await import("./marketing/server-events.server");
        const properties: Record<string, unknown> = {
          ...(data.properties ?? {}),
          oasis_source: data.source,
          oasis_lead_kind: data.kind,
          oasis_consent_at: record.consent.timestamp,
          ...(record.attribution["first_utm_source"]
            ? { oasis_first_source: record.attribution["first_utm_source"] }
            : {}),
          ...(record.attribution["last_utm_campaign"]
            ? { oasis_last_campaign: record.attribution["last_utm_campaign"] }
            : {}),
        };
        const outcome = await upsertKlaviyoProfile({
          ...(record.email ? { email: record.email } : {}),
          ...(record.phone ? { phone: record.phone } : {}),
          properties,
        });
        if (outcome === "sent") syncState = syncState === "failed" ? "failed" : "synced";
      } catch {
        /* Klaviyo failure never loses the persisted record */
      }
    }

    markSync(record.key, syncState);
    return { status: "saved", deduped, syncState };
  });

/** Pending-sync counters for the private status surface. */
export const leadQueueStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { leadCounts } = await import("./leads.server");
  return leadCounts();
});
