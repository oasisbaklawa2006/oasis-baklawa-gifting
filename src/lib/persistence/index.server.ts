/**
 * REPOSITORY SELECTION (server-only)
 *
 * Lead storage, in order of precedence:
 *   1. Core's scoped Gifting Enquiries queue, when either scoped setting
 *      (`GIFTING_ENQUIRIES_ENDPOINT` / `GIFTING_ENQUIRIES_TOKEN`) is present. This is the
 *      Option A production path and takes strict, unconditional precedence: legacy database
 *      credentials never win when it is selected, and an incomplete pair fails closed.
 *   2. The project database, when its server credentials exist and no scoped setting is set.
 *   3. Process memory, which is never durable. Public lead submission refuses it, so
 *      missing configuration fails closed rather than silently accepting enquiries.
 * Saved-basket recovery can still use memory.
 */

import {
  databaseConfigured,
  databaseLeadsRepository,
  databaseRecoveryRepository,
} from "./database.server";
import { createMemoryLeadsRepository, createMemoryRecoveryRepository } from "./memory-repositories";
import {
  SCOPED_ENQUIRY_PROVIDER,
  scopedEnquiryConfigured,
  scopedEnquiryLeadsRepository,
  scopedEnquiryRequested,
} from "./scoped-enquiry.server";
import type { LeadsRepository, RecoveryRepository } from "./types";

const memoryLeads = createMemoryLeadsRepository();
const memoryRecovery = createMemoryRecoveryRepository();

export function leadsRepository(): LeadsRepository {
  if (scopedEnquiryRequested()) {
    // Selected scoped endpoint: an incomplete pair is refused (memory never accepts public
    // enquiries), never rescued by the legacy database credentials.
    return scopedEnquiryConfigured() ? scopedEnquiryLeadsRepository : memoryLeads;
  }
  if (databaseConfigured()) return databaseLeadsRepository;
  return memoryLeads;
}

export function recoveryRepository(): RecoveryRepository {
  return databaseConfigured() ? databaseRecoveryRepository : memoryRecovery;
}

export type PersistenceHealth = {
  provider: string;
  durability: "durable" | "ephemeral";
  note: string;
  leads: Awaited<ReturnType<LeadsRepository["counts"]>>;
  recovery: Awaited<ReturnType<RecoveryRepository["counts"]>>;
};

export async function persistenceHealth(): Promise<PersistenceHealth> {
  const leads = leadsRepository();
  const recovery = recoveryRepository();
  const durable = leads.durability === "durable";
  return {
    provider: leads.provider,
    durability: leads.durability,
    note:
      leads.provider === SCOPED_ENQUIRY_PROVIDER
        ? "Enquiries are delivered to Core's Gifting Enquiries queue and are only accepted after Core returns a matching receipt. Newsletter and rewards sign-ups are not stored in this configuration, and saved-basket links use server memory."
        : durable
          ? "Enquiries and saved-basket links are stored in the project database and survive restarts and deploys. Records awaiting Oasis Central carry an explicit pending-sync state."
          : "The project database is not configured. Enquiry and subscription forms are unavailable. Saved-basket links use server memory and are lost on restart.",
    leads: await leads.counts(),
    recovery: await recovery.counts(),
  };
}

/** Housekeeping: mark due recovery sessions expired. Safe to call repeatedly. */
export async function runPersistenceMaintenance(): Promise<{ expired: number }> {
  return { expired: await recoveryRepository().expireDue() };
}
