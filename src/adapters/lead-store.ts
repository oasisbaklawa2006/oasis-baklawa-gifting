/**
 * LEAD / QUEUE PERSISTENCE ADAPTER
 *
 * IMPORTANT DURABILITY STATEMENT
 * The only backing store available without external credentials is process
 * memory. Process memory is NOT durable: every deploy, restart or idle
 * shutdown of the server loses queued leads and cart-recovery records. This
 * module therefore reports its own durability honestly (`durability:
 * "ephemeral"`) and the private admin surface shows it as a production
 * blocker. Swapping in a real store (Appverse, Postgres, Klaviyo) means
 * implementing `LeadStore` once — no UI or server function changes.
 */

import { registerAdapter, resolveAdapter } from "./registry";

export type StoreDurability = "ephemeral" | "durable";

export interface LeadStore<T extends { key: string }> {
  readonly provider: string;
  readonly durability: StoreDurability;
  get(key: string): T | undefined;
  put(record: T): T;
  list(): T[];
  clear(): void;
}

export function createMemoryStore<T extends { key: string }>(
  provider = "memory",
): LeadStore<T> {
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

registerAdapter({
  id: "lead-store:appverse",
  domain: "lead-store",
  provider: "appverse",
  label: "Oasis Central / Appverse queue (durable, preferred)",
  capabilities: ["dedupe", "sync-state", "durable-persistence", "replay"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "In-process memory queue, which is not durable.",
});

registerAdapter({
  id: "lead-store:database",
  domain: "lead-store",
  provider: "database",
  label: "Managed database queue (durable, optional)",
  capabilities: ["dedupe", "sync-state", "durable-persistence"],
  requiredEnv: ["LEAD_DATABASE_URL"],
  fallback: "In-process memory queue, which is not durable.",
});

/** Durability of the store actually in use right now. */
export function leadStoreDurability(): StoreDurability {
  const descriptor = resolveAdapter("lead-store");
  return descriptor && descriptor.provider !== "memory" ? "durable" : "ephemeral";
}
