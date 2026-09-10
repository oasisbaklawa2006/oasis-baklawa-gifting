/**
 * LEAD / SUBSCRIPTION PERSISTENCE (server-only)
 *
 * One store for every capture surface: newsletter, contact, corporate,
 * wedding and rewards. Records are de-duplicated on a normalized email/phone
 * key, keep the consent timestamp and source, and are marked `pending_sync`
 * until Appverse/Central or Klaviyo accepts them.
 *
 * No customer-facing success is ever shown unless a record was persisted here.
 *
 * DURABILITY WARNING — READ BEFORE PRODUCTION
 * The backing store is process memory (see `src/adapters/lead-store.ts`). It is
 * NOT durable: every restart, deploy or idle shutdown loses queued records.
 * The private admin surface reports this as `durability: "ephemeral"`. Swapping
 * in Appverse or a managed database touches this module only — never the UI or
 * the server functions.
 */

export type LeadKind =
  "newsletter" | "contact" | "corporate" | "wedding" | "rewards" | "partnership";

export type LeadSyncState = "pending_sync" | "synced" | "failed";

export type LeadRecord = {
  id: string;
  kind: LeadKind;
  /** Normalized dedupe key: lower-cased email, else digits-only phone. */
  key: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  message?: string;
  /** Non-identifying campaign attribution only. */
  attribution: Record<string, string>;
  consent: { marketing: boolean; timestamp: string };
  source: string;
  createdAt: string;
  updatedAt: string;
  syncState: LeadSyncState;
  syncDetail?: string;
};

const store = new Map<string, LeadRecord>();

export function normalizeKey(email?: string, phone?: string): string {
  if (email) return email.trim().toLowerCase();
  if (phone) return phone.replace(/[^0-9]/g, "");
  return "";
}

export function dedupeKey(kind: LeadKind, email?: string, phone?: string): string {
  return `${kind}:${normalizeKey(email, phone)}`;
}

export function saveLead(
  input: Omit<LeadRecord, "id" | "key" | "createdAt" | "updatedAt" | "syncState">,
): LeadRecord {
  const key = dedupeKey(input.kind, input.email, input.phone);
  const now = new Date().toISOString();
  const existing = store.get(key);

  const record: LeadRecord = existing
    ? {
        ...existing,
        ...input,
        // The first consent timestamp is the record of when permission was given.
        consent: existing.consent.marketing ? existing.consent : input.consent,
        updatedAt: now,
      }
    : {
        ...input,
        id: `lead_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`,
        key,
        createdAt: now,
        updatedAt: now,
        syncState: "pending_sync",
      };

  store.set(key, record);
  return record;
}

export function markSync(key: string, state: LeadSyncState, detail?: string): void {
  const record = store.get(key);
  if (!record) return;
  store.set(key, {
    ...record,
    syncState: state,
    ...(detail ? { syncDetail: detail } : {}),
    updatedAt: new Date().toISOString(),
  });
}

export function listLeads(): LeadRecord[] {
  return [...store.values()];
}

export function leadCounts(): Record<LeadSyncState, number> {
  const counts: Record<LeadSyncState, number> = { pending_sync: 0, synced: 0, failed: 0 };
  for (const record of store.values()) counts[record.syncState] += 1;
  return counts;
}

/** Test helper. */
export function resetLeads(): void {
  store.clear();
}
