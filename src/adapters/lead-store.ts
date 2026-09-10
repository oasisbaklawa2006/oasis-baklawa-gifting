/**
 * LEAD / QUEUE PERSISTENCE ADAPTER
 *
 * DURABILITY STATEMENT
 * The website's own durable store is the project database
 * (`public.website_leads`, `public.cart_recovery_sessions`), reached
 * server-side only. When it is configured, queued leads and cart-recovery
 * sessions survive restarts and deploys and carry an explicit pending-sync
 * state for a later Oasis Central connector.
 *
 * If the database is not configured the site falls back to process memory,
 * which is NOT durable, and every status surface reports that honestly.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import { envPresent } from "./env";

export type StoreDurability = "ephemeral" | "durable";

export interface LeadStore<T extends { key: string }> {
  readonly provider: string;
  readonly durability: StoreDurability;
  get(key: string): T | undefined;
  put(record: T): T;
  list(): T[];
  clear(): void;
}

export function createMemoryStore<T extends { key: string }>(provider = "memory"): LeadStore<T> {
  const map = new Map<string, T>();
  return {
    provider,
    durability: "ephemeral",
    get: (key) => map.get(key),
    put(record) {
      map.set(record.key, record);
      return record;
    },
    list: () => [...map.values()],
    clear: () => map.clear(),
  };
}

registerAdapter({
  id: "lead-store:database",
  domain: "lead-store",
  provider: "database",
  label: "Project database queue (durable)",
  capabilities: ["dedupe", "sync-state", "durable-persistence", "idempotent-writes", "expiry"],
  requiredEnv: ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  fallback: "In-process memory queue, which is not durable.",
});

registerAdapter({
  id: "lead-store:appverse",
  domain: "lead-store",
  provider: "appverse",
  label: "Oasis Central / Appverse queue (authoritative, future)",
  capabilities: ["dedupe", "sync-state", "durable-persistence", "replay"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "Records stay in the project database with an explicit pending-sync state.",
});

registerAdapter({
  id: "lead-store:memory",
  domain: "lead-store",
  provider: "memory",
  label: "In-process memory queue (NOT durable)",
  capabilities: ["dedupe", "sync-state"],
  requiredEnv: [],
  fallback:
    "Queued leads and cart-recovery records are lost on restart or deploy. Not production-safe on its own.",
  isFallback: true,
});

/** True when the server-side database credentials for durable storage exist. */
export function databaseStoreConfigured(): boolean {
  return envPresent("SUPABASE_URL") && envPresent("SUPABASE_SERVICE_ROLE_KEY");
}

/** Durability of the store actually in use right now. */
export function leadStoreDurability(): StoreDurability {
  if (databaseStoreConfigured()) return "durable";
  const descriptor = resolveAdapter("lead-store");
  return descriptor && descriptor.provider !== "memory" ? "durable" : "ephemeral";
}
