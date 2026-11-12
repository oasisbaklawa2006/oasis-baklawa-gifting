/**
 * DATABASE-BACKED PERSISTENCE (server-only)
 *
 * Durable implementations of the lead and cart-recovery ports on the project
 * database. Access is service-role and server-only: the tables carry row level
 * security with no policies, so nothing reachable from a browser can read or
 * write them.
 *
 * Nothing here is authoritative commerce truth. Recovery sessions store only
 * the product/variant/quantity intent — never a price, stock level or total —
 * so a restored basket is always re-priced through the commerce provider.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type {
  ClaimOutcome,
  LeadDraft,
  LeadKind,
  LeadRecord,
  LeadSyncState,
  LeadsRepository,
  RecordSessionOutcome,
  RecoveryLine,
  RecoveryRepository,
  RecoverySession,
  RecoverySessionStatus,
} from "./types";
import { dedupeKey } from "./memory-repositories";

export { dedupeKey };

export function databaseConfigured(): boolean {
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}

type LeadRow = {
  id: string;
  kind: string;
  dedupe_key: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  company: string | null;
  message: string | null;
  source: string;
  attribution: unknown;
  marketing_consent: boolean;
  consent_at: string | null;
  submission_count: number;
  sync_state: string;
  sync_detail: string | null;
  created_at: string;
  updated_at: string;
};

function asStringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string") out[key] = item;
  }
  return out;
}

function toLead(row: LeadRow): LeadRecord {
  return {
    id: row.id,
    kind: row.kind as LeadKind,
    key: row.dedupe_key,
    ...(row.email ? { email: row.email } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.full_name ? { name: row.full_name } : {}),
    ...(row.company ? { company: row.company } : {}),
    ...(row.message ? { message: row.message } : {}),
    attribution: asStringMap(row.attribution),
    consent: { marketing: row.marketing_consent, timestamp: row.consent_at },
    source: row.source,
    submissionCount: row.submission_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    syncState: row.sync_state as LeadSyncState,
    ...(row.sync_detail ? { syncDetail: row.sync_detail } : {}),
  };
}

export const databaseLeadsRepository: LeadsRepository = {
  provider: "database",
  durability: "durable",

  async save(draft: LeadDraft) {
    const key = dedupeKey(draft.kind, draft.email, draft.phone, draft.submissionId);
    if (!key.split(":")[1]) return { ok: false as const, reason: "No contact detail supplied." };

    const email = draft.email?.trim().toLowerCase() ?? null;
    const phone = draft.phone?.trim() ?? null;

    try {
      const existing = await supabaseAdmin
        .from("website_leads")
        .select("*")
        .eq("dedupe_key", key)
        .maybeSingle();
      if (existing.error) return { ok: false as const, reason: existing.error.message };

      const previous = existing.data as LeadRow | null;
      if (
        previous &&
        draft.submissionId &&
        ["corporate", "wedding", "contact", "partnership"].includes(draft.kind)
      ) {
        return { ok: true as const, record: toLead(previous), deduped: true };
      }
      const nowIso = new Date().toISOString();

      // The first consent timestamp is the record of when permission was given.
      const consentAt = previous?.marketing_consent
        ? previous.consent_at
        : draft.consent.marketing
          ? (draft.consent.timestamp ?? nowIso)
          : (previous?.consent_at ?? null);

      const payload = {
        kind: draft.kind,
        dedupe_key: key,
        email,
        phone,
        full_name: draft.name ?? null,
        company: draft.company ?? null,
        message: draft.message ?? null,
        source: draft.source,
        attribution: draft.attribution ?? {},
        marketing_consent: previous?.marketing_consent || draft.consent.marketing,
        consent_at: consentAt,
        submission_count: (previous?.submission_count ?? 0) + 1,
        sync_state: "pending_sync",
        sync_detail: null,
        last_submitted_at: nowIso,
      };

      // Enquiry UUIDs are insert-only: a concurrent retry must never overwrite
      // the original message, consent or an already-completed Central handoff.
      if (
        draft.submissionId &&
        ["corporate", "wedding", "contact", "partnership"].includes(draft.kind)
      ) {
        const inserted = await supabaseAdmin
          .from("website_leads")
          .insert(payload)
          .select("*")
          .single();
        if (!inserted.error) {
          return { ok: true as const, record: toLead(inserted.data as LeadRow), deduped: false };
        }
        if (inserted.error.code !== "23505") {
          return { ok: false as const, reason: inserted.error.message };
        }
        const winner = await supabaseAdmin
          .from("website_leads")
          .select("*")
          .eq("dedupe_key", key)
          .maybeSingle();
        if (winner.error || !winner.data) {
          return {
            ok: false as const,
            reason: winner.error?.message ?? "Enquiry retry unavailable.",
          };
        }
        return { ok: true as const, record: toLead(winner.data as LeadRow), deduped: true };
      }

      // Subscription-style contact deduplication intentionally retains the
      // existing update semantics for newsletter and rewards submissions.
      const upserted = await supabaseAdmin
        .from("website_leads")
        .upsert(payload, { onConflict: "dedupe_key" })
        .select("*")
        .single();
      if (upserted.error) return { ok: false as const, reason: upserted.error.message };

      return {
        ok: true as const,
        record: toLead(upserted.data as LeadRow),
        deduped: Boolean(previous),
      };
    } catch (error) {
      return { ok: false as const, reason: (error as Error).message };
    }
  },

  async markSync(key, state, detail) {
    try {
      await supabaseAdmin
        .from("website_leads")
        .update({
          sync_state: state,
          sync_detail: detail ?? null,
          synced_at: state === "synced" ? new Date().toISOString() : null,
        })
        .eq("dedupe_key", key);
    } catch {
      /* the record is already stored; a sync-state write failure never loses it */
    }
  },

  async counts() {
    const counts: Record<LeadSyncState, number> = { pending_sync: 0, synced: 0, failed: 0 };
    try {
      const { data, error } = await supabaseAdmin.from("website_leads").select("sync_state");
      if (error || !data) return counts;
      for (const row of data as { sync_state: string }[]) {
        const state = row.sync_state as LeadSyncState;
        if (state in counts) counts[state] += 1;
      }
    } catch {
      /* counters are diagnostics only */
    }
    return counts;
  },

  async pendingSync(limit = 50) {
    try {
      const { data, error } = await supabaseAdmin
        .from("website_leads")
        .select("*")
        .neq("sync_state", "synced")
        .order("created_at", { ascending: true })
        .limit(limit);
      if (error || !data) return [];
      return (data as LeadRow[]).map(toLead);
    } catch {
      return [];
    }
  },
};

type RecoveryRow = {
  id: string;
  cart_id: string;
  lines: unknown;
  status: string;
  issued_at: string;
  expires_at: string;
  redeem_count: number;
  last_redeemed_at: string | null;
};

function toLines(value: unknown): RecoveryLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const line = entry as Record<string, unknown>;
    if (typeof line["productId"] !== "string" || typeof line["variantId"] !== "string") return [];
    const quantity = Number(line["quantity"]);
    if (!Number.isFinite(quantity) || quantity < 1) return [];
    return [
      {
        productId: line["productId"],
        variantId: line["variantId"],
        quantity: Math.min(99, Math.trunc(quantity)),
      },
    ];
  });
}

function toSession(row: RecoveryRow): RecoverySession {
  return {
    id: row.id,
    cartId: row.cart_id,
    lines: toLines(row.lines),
    status: row.status as RecoverySessionStatus,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    redeemCount: row.redeem_count,
    lastRedeemedAt: row.last_redeemed_at,
  };
}

export const databaseRecoveryRepository: RecoveryRepository = {
  provider: "database",
  durability: "durable",

  async record(input): Promise<RecordSessionOutcome> {
    try {
      const existing = await supabaseAdmin
        .from("cart_recovery_sessions")
        .select("*")
        .eq("token_hash", input.tokenHash)
        .maybeSingle();
      if (existing.error) return { ok: false, reason: existing.error.message };
      if (existing.data) {
        return { ok: true, session: toSession(existing.data as RecoveryRow), deduped: true };
      }

      const inserted = await supabaseAdmin
        .from("cart_recovery_sessions")
        .upsert(
          {
            token_hash: input.tokenHash,
            cart_id: input.cartId,
            lines: input.lines,
            expires_at: input.expiresAt,
            attribution: input.attribution ?? {},
            status: "active",
          },
          { onConflict: "token_hash" },
        )
        .select("*")
        .single();
      if (inserted.error) return { ok: false, reason: inserted.error.message };
      return { ok: true, session: toSession(inserted.data as RecoveryRow), deduped: false };
    } catch (error) {
      return { ok: false, reason: (error as Error).message };
    }
  },

  async claim(tokenHash, now = new Date()): Promise<ClaimOutcome> {
    try {
      const { data, error } = await supabaseAdmin
        .from("cart_recovery_sessions")
        .select("*")
        .eq("token_hash", tokenHash)
        .maybeSingle();
      if (error) {
        return { ok: false, reason: "unavailable", detail: error.message };
      }
      if (!data) {
        return { ok: false, reason: "unknown", detail: "No saved basket matches this link." };
      }

      const session = toSession(data as RecoveryRow);
      if (session.status === "cancelled") {
        return { ok: false, reason: "cancelled", detail: "This basket link was cancelled." };
      }
      if (new Date(session.expiresAt).getTime() <= now.getTime()) {
        await supabaseAdmin
          .from("cart_recovery_sessions")
          .update({ status: "expired" })
          .eq("token_hash", tokenHash);
        return { ok: false, reason: "expired", detail: "This basket link has expired." };
      }

      const updated = await supabaseAdmin
        .from("cart_recovery_sessions")
        .update({
          status: "redeemed",
          redeem_count: session.redeemCount + 1,
          last_redeemed_at: now.toISOString(),
        })
        .eq("token_hash", tokenHash)
        .select("*")
        .single();

      return {
        ok: true,
        session: updated.error ? session : toSession(updated.data as RecoveryRow),
      };
    } catch (error) {
      return { ok: false, reason: "unavailable", detail: (error as Error).message };
    }
  },

  async expireDue() {
    try {
      const { data, error } = await supabaseAdmin.rpc("expire_cart_recovery_sessions");
      if (error) return 0;
      return typeof data === "number" ? data : 0;
    } catch {
      return 0;
    }
  },

  async counts() {
    const counts: Record<RecoverySessionStatus, number> = {
      active: 0,
      redeemed: 0,
      expired: 0,
      cancelled: 0,
    };
    try {
      const { data, error } = await supabaseAdmin.from("cart_recovery_sessions").select("status");
      if (error || !data) return counts;
      for (const row of data as { status: string }[]) {
        const status = row.status as RecoverySessionStatus;
        if (status in counts) counts[status] += 1;
      }
    } catch {
      /* diagnostics only */
    }
    return counts;
  },
};

/** Record an inbound webhook once. `false` means it was already handled. */
export async function claimWebhookEvent(input: {
  provider: string;
  eventId: string;
  eventType?: string;
}): Promise<{ ok: true; fresh: boolean } | { ok: false; reason: string }> {
  try {
    const { error } = await supabaseAdmin.from("integration_webhook_events").insert({
      provider: input.provider,
      event_id: input.eventId,
      event_type: input.eventType ?? null,
    });
    if (!error) return { ok: true, fresh: true };
    // 23505 = unique violation: this exact event was already accepted.
    if (error.code === "23505") return { ok: true, fresh: false };
    return { ok: false, reason: error.message };
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }
}

export async function markWebhookEvent(
  provider: string,
  eventId: string,
  status: "processed" | "failed",
  detail?: string,
): Promise<void> {
  try {
    await supabaseAdmin
      .from("integration_webhook_events")
      .update({
        status,
        detail: detail ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("provider", provider)
      .eq("event_id", eventId);
  } catch {
    /* the replay guard row already exists; status is diagnostics only */
  }
}
