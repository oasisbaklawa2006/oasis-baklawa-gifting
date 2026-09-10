/**
 * IN-MEMORY REPOSITORY IMPLEMENTATIONS
 *
 * Test doubles and last-resort fallback. They implement exactly the same
 * ports as the database repositories and report `durability: "ephemeral"`
 * so no surface can mistake them for production storage.
 */

import type {
  ClaimOutcome,
  LeadDraft,
  LeadRecord,
  LeadSyncState,
  LeadsRepository,
  RecordSessionOutcome,
  RecoveryRepository,
  RecoverySession,
  RecoverySessionStatus,
} from "./types";

export function dedupeKey(kind: string, email?: string, phone?: string): string {
  const normalizedEmail = email?.trim().toLowerCase() || undefined;
  const normalizedPhone = phone?.replace(/[^0-9]/g, "") || undefined;
  return `${kind}:${normalizedEmail ?? normalizedPhone ?? ""}`;
}

export function createMemoryLeadsRepository(): LeadsRepository & { reset(): void } {
  const rows = new Map<string, LeadRecord>();

  return {
    provider: "memory",
    durability: "ephemeral",
    async save(draft: LeadDraft) {
      const key = dedupeKey(draft.kind, draft.email, draft.phone);
      if (!key.split(":")[1]) return { ok: false as const, reason: "No contact detail supplied." };
      const now = new Date().toISOString();
      const existing = rows.get(key);
      const record: LeadRecord = existing
        ? {
            ...existing,
            ...draft,
            consent: existing.consent.marketing ? existing.consent : draft.consent,
            submissionCount: existing.submissionCount + 1,
            syncState: "pending_sync",
            updatedAt: now,
          }
        : {
            ...draft,
            id: `lead_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
            key,
            submissionCount: 1,
            syncState: "pending_sync",
            createdAt: now,
            updatedAt: now,
          };
      rows.set(key, record);
      return { ok: true as const, record, deduped: Boolean(existing) };
    },
    async markSync(key, state, detail) {
      const record = rows.get(key);
      if (!record) return;
      rows.set(key, {
        ...record,
        syncState: state,
        ...(detail ? { syncDetail: detail } : {}),
        updatedAt: new Date().toISOString(),
      });
    },
    async counts() {
      const counts: Record<LeadSyncState, number> = { pending_sync: 0, synced: 0, failed: 0 };
      for (const record of rows.values()) counts[record.syncState] += 1;
      return counts;
    },
    async pendingSync(limit = 50) {
      return [...rows.values()]
        .filter((record) => record.syncState !== "synced")
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .slice(0, limit);
    },
    reset: () => rows.clear(),
  };
}

export function createMemoryRecoveryRepository(): RecoveryRepository & { reset(): void } {
  const rows = new Map<string, RecoverySession>();

  return {
    provider: "memory",
    durability: "ephemeral",
    async record(input): Promise<RecordSessionOutcome> {
      const existing = rows.get(input.tokenHash);
      if (existing) return { ok: true, session: existing, deduped: true };
      const session: RecoverySession = {
        id: `rec_${Math.random().toString(36).slice(2)}`,
        cartId: input.cartId,
        lines: input.lines,
        status: "active",
        issuedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        redeemCount: 0,
        lastRedeemedAt: null,
      };
      rows.set(input.tokenHash, session);
      return { ok: true, session, deduped: false };
    },
    async claim(tokenHash, now = new Date()): Promise<ClaimOutcome> {
      const session = rows.get(tokenHash);
      if (!session) {
        return { ok: false, reason: "unknown", detail: "No saved basket matches this link." };
      }
      if (session.status === "cancelled") {
        return { ok: false, reason: "cancelled", detail: "This basket link was cancelled." };
      }
      if (new Date(session.expiresAt).getTime() <= now.getTime()) {
        rows.set(tokenHash, { ...session, status: "expired" });
        return { ok: false, reason: "expired", detail: "This basket link has expired." };
      }
      const updated: RecoverySession = {
        ...session,
        status: "redeemed",
        redeemCount: session.redeemCount + 1,
        lastRedeemedAt: now.toISOString(),
      };
      rows.set(tokenHash, updated);
      return { ok: true, session: updated };
    },
    async expireDue(now = new Date()) {
      let affected = 0;
      for (const [hash, session] of rows) {
        if (session.status === "active" && new Date(session.expiresAt).getTime() <= now.getTime()) {
          rows.set(hash, { ...session, status: "expired" });
          affected += 1;
        }
      }
      return affected;
    },
    async counts() {
      const counts: Record<RecoverySessionStatus, number> = {
        active: 0,
        redeemed: 0,
        expired: 0,
        cancelled: 0,
      };
      for (const session of rows.values()) counts[session.status] += 1;
      return counts;
    },
    reset: () => rows.clear(),
  };
}
