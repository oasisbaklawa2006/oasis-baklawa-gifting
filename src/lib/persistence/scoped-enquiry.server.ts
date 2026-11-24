/**
 * SCOPED ENQUIRY PERSISTENCE (server-only)
 *
 * Option A persists website enquiries directly to Core's Gifting Enquiries queue
 * through the scoped Connect bearer token (`GIFTING_ENQUIRIES_ENDPOINT` +
 * `GIFTING_ENQUIRIES_TOKEN`). This repository needs no database credential at all:
 * it never imports the Supabase admin client and never reads `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Durability is proven per write, not assumed from configuration. `save` reports
 * success only after Core returns a validated receipt for this exact enquiry.
 * Every other outcome is a failure the customer is told about: a missing or
 * misconfigured endpoint, a non-2xx response, a timeout, or a receipt that does not
 * match. There is no memory fallback.
 *
 * Only the four enquiry kinds the Core receiver accepts can be stored here.
 * Newsletter and rewards sign-ups have no scoped receiver, so they fail closed
 * instead of being queued somewhere that cannot deliver them.
 */

import { sendGiftingEnquiry } from "../gifting-enquiry-handoff.server";
import { dedupeKey } from "./memory-repositories";
import type { LeadDraft, LeadRecord, LeadSyncState, LeadsRepository } from "./types";

export const SCOPED_ENQUIRY_PROVIDER = "core-gifting-enquiries";

const ENQUIRY_KINDS: ReadonlySet<string> = new Set([
  "contact",
  "corporate",
  "wedding",
  "partnership",
]);

export type ScopedEnquiryConfig = { endpoint: string; token: string };

/** Both settings must be present. Anything less is treated as not configured (fail closed). */
export function readScopedEnquiryConfig(
  env: Record<string, string | undefined> = process.env,
): ScopedEnquiryConfig | null {
  const endpoint = (env["GIFTING_ENQUIRIES_ENDPOINT"] ?? "").trim();
  const token = (env["GIFTING_ENQUIRIES_TOKEN"] ?? "").trim();
  return endpoint && token ? { endpoint, token } : null;
}

/**
 * True when ANY scoped-enquiry setting is present. Option A gives the scoped endpoint
 * strict, unconditional precedence over the legacy database credentials: once the
 * operator has set either scoped variable, enquiries go to the scoped repository (which
 * fails closed if the pair is incomplete) and never fall back to the database.
 */
export function scopedEnquiryRequested(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(
    (env["GIFTING_ENQUIRIES_ENDPOINT"] ?? "").trim() ||
    (env["GIFTING_ENQUIRIES_TOKEN"] ?? "").trim(),
  );
}

export function scopedEnquiryConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return readScopedEnquiryConfig(env) !== null;
}

type Send = typeof sendGiftingEnquiry;

export function createScopedEnquiryLeadsRepository(
  readConfig: () => ScopedEnquiryConfig | null = () => readScopedEnquiryConfig(),
  send: Send = sendGiftingEnquiry,
): LeadsRepository {
  return {
    provider: SCOPED_ENQUIRY_PROVIDER,
    durability: "durable",

    async save(draft: LeadDraft) {
      if (!ENQUIRY_KINDS.has(draft.kind)) {
        return {
          ok: false as const,
          reason: "This sign-up type is not stored in the current configuration.",
        };
      }
      if (!draft.submissionId) {
        return { ok: false as const, reason: "An enquiry submission identifier is required." };
      }
      const config = readConfig();
      if (!config) {
        return { ok: false as const, reason: "Gifting Enquiries endpoint is not configured." };
      }

      const now = new Date().toISOString();
      const id = draft.submissionId.toLowerCase();
      const pending: LeadRecord = {
        ...draft,
        id,
        key: dedupeKey(draft.kind, draft.email, draft.phone, draft.submissionId),
        submissionCount: 1,
        createdAt: now,
        updatedAt: now,
        syncState: "pending_sync",
      };

      const handoff = await send(pending, config);
      if (handoff.status === "synced") {
        // The receipt matched this enquiry's id, so Core has durably queued it.
        return {
          ok: true as const,
          record: { ...pending, syncState: "synced" },
          deduped: false,
        };
      }
      return {
        ok: false as const,
        reason:
          handoff.status === "failed"
            ? handoff.detail
            : "Gifting Enquiries did not confirm the enquiry.",
      };
    },

    // No local queue exists. Core's receipt is the only record, so there is nothing to mark or retry here.
    async markSync() {},
    async counts() {
      const counts: Record<LeadSyncState, number> = { pending_sync: 0, synced: 0, failed: 0 };
      return counts;
    },
    async pendingSync() {
      return [];
    },
  };
}

export const scopedEnquiryLeadsRepository = createScopedEnquiryLeadsRepository();
