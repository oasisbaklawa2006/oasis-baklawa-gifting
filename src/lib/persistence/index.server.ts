/**
 * REPOSITORY SELECTION (server-only)
 *
 * The project database is the durable store. Without it the shared health
 * check reports ephemeral storage. Public lead submission requires a durable
 * repository, while saved-basket recovery can still use memory.
 */

import {
  databaseConfigured,
  databaseLeadsRepository,
  databaseRecoveryRepository,
} from "./database.server";
import { createMemoryLeadsRepository, createMemoryRecoveryRepository } from "./memory-repositories";
import type { LeadsRepository, RecoveryRepository } from "./types";

const memoryLeads = createMemoryLeadsRepository();
const memoryRecovery = createMemoryRecoveryRepository();

export function leadsRepository(): LeadsRepository {
  return databaseConfigured() ? databaseLeadsRepository : memoryLeads;
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
    note: durable
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
