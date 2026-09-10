/**
 * LEAD / SUBSCRIPTION PERSISTENCE (server-only)
 *
 * One store for every capture surface: newsletter, contact, corporate,
 * wedding, rewards and partnership. Records are de-duplicated on a normalized
 * email/phone key, keep the consent timestamp and source, and are marked
 * `pending_sync` until Appverse/Central or Klaviyo accepts them.
 *
 * DURABILITY: backed by the project database (`public.website_leads`) through
 * the repository port in `src/lib/persistence`. Writes are idempotent on the
 * dedupe key, so a retried submission updates one row rather than creating a
 * duplicate. No customer-facing success is shown unless the write succeeded.
 */

import { leadsRepository } from "./persistence/index.server";
import { dedupeKey } from "./persistence/memory-repositories";
import type {
  LeadDraft,
  LeadKind,
  LeadRecord,
  LeadSyncState,
  SaveLeadOutcome,
} from "./persistence/types";

export type { LeadDraft, LeadKind, LeadRecord, LeadSyncState, SaveLeadOutcome };
export { dedupeKey };

export async function saveLead(draft: LeadDraft): Promise<SaveLeadOutcome> {
  return leadsRepository().save(draft);
}

export async function markSync(
  key: string,
  state: LeadSyncState,
  detail?: string,
): Promise<void> {
  await leadsRepository().markSync(key, state, detail);
}

export async function leadCounts(): Promise<Record<LeadSyncState, number>> {
  return leadsRepository().counts();
}

/** Records still owed to Oasis Central — an explicit backlog, never assumed sent. */
export async function pendingSyncLeads(limit = 50): Promise<LeadRecord[]> {
  return leadsRepository().pendingSync(limit);
}
