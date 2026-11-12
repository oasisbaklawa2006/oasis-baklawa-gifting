/**
 * DURABLE PERSISTENCE PORTS
 *
 * The website owns two pieces of state that must survive a restart: captured
 * leads and issued cart-recovery sessions. Both are described here as narrow
 * ports so the backing store is replaceable (project database today, Oasis
 * Central / Appverse later) without touching UI or server functions.
 *
 * Oasis Central remains the operational authority. Everything stored here is
 * an outbox: records carry an explicit sync state and are never assumed to
 * have reached Central.
 */

export type LeadKind =
  "newsletter" | "contact" | "corporate" | "wedding" | "rewards" | "partnership";

export type LeadSyncState = "pending_sync" | "synced" | "failed";

export type LeadRecord = {
  id: string;
  kind: LeadKind;
  /** Contact dedupe for subscriptions; submission-specific key for enquiries. */
  key: string;
  email?: string;
  phone?: string;
  /** Stable client-generated idempotency token for individual enquiries. */
  submissionId?: string;
  name?: string;
  company?: string;
  message?: string;
  /** Approved, non-identifying campaign attribution only. */
  attribution: Record<string, string>;
  consent: { marketing: boolean; timestamp: string | null };
  source: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
  syncState: LeadSyncState;
  syncDetail?: string;
};

export type LeadDraft = Omit<
  LeadRecord,
  "id" | "key" | "createdAt" | "updatedAt" | "syncState" | "submissionCount"
>;

export type SaveLeadOutcome =
  { ok: true; record: LeadRecord; deduped: boolean } | { ok: false; reason: string };

export interface LeadsRepository {
  readonly provider: string;
  readonly durability: "durable" | "ephemeral";
  save(draft: LeadDraft): Promise<SaveLeadOutcome>;
  markSync(key: string, state: LeadSyncState, detail?: string): Promise<void>;
  counts(): Promise<Record<LeadSyncState, number>>;
  /** Unsynced records, oldest first — a future Central connector's work queue. */
  pendingSync(limit?: number): Promise<LeadRecord[]>;
}

export type RecoveryLine = { productId: string; variantId: string; quantity: number };

export type RecoverySessionStatus = "active" | "redeemed" | "expired" | "cancelled";

export type RecoverySession = {
  id: string;
  cartId: string;
  lines: RecoveryLine[];
  status: RecoverySessionStatus;
  issuedAt: string;
  expiresAt: string;
  redeemCount: number;
  lastRedeemedAt: string | null;
};

export type RecordSessionOutcome =
  { ok: true; session: RecoverySession; deduped: boolean } | { ok: false; reason: string };

export type ClaimOutcome =
  | { ok: true; session: RecoverySession }
  | { ok: false; reason: "unknown" | "expired" | "cancelled" | "unavailable"; detail: string };

export interface RecoveryRepository {
  readonly provider: string;
  readonly durability: "durable" | "ephemeral";
  /** Idempotent on `tokenHash`: re-issuing the same token never duplicates a row. */
  record(input: {
    tokenHash: string;
    cartId: string;
    lines: RecoveryLine[];
    expiresAt: string;
    attribution?: Record<string, string>;
  }): Promise<RecordSessionOutcome>;
  /** Look the session up and mark the redemption. Never returns cart pricing. */
  claim(tokenHash: string, now?: Date): Promise<ClaimOutcome>;
  expireDue(now?: Date): Promise<number>;
  counts(): Promise<Record<RecoverySessionStatus, number>>;
}
