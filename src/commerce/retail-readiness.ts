/**
 * Fail-closed consumer of Core's retail commerce readiness contract.
 *
 * STATUS: PENDING OWNER APPROVAL. NOT ACTIVATED. Core's proposed retail architecture (one governed B2C
 * order surface) is a proposal until an administrator approves it there and separately activates it.
 * This module does not enable anything: it only turns Core's readiness answer into a yes/no for one
 * commercial action, and answers "no" for anything it cannot positively verify. It is deliberately not
 * wired into checkout, which stays held (see payment launch policy and quote-policy.ts).
 *
 * Core contract: oasis-supabase-core `retail_commerce_readiness_v1()` (migration
 * 20261118230000_retail_commerce_configuration_v1.sql). The response lists setting NAMES and statuses
 * only; configured values never cross this boundary.
 */
import { z } from "zod";

export const RETAIL_ACTIONS = ["quote", "order", "payment", "refund"] as const;
export type RetailAction = (typeof RETAIL_ACTIONS)[number];

const actionSchema = z.object({
  allowed: z.boolean(),
  missing: z.array(z.string()),
  unapproved: z.array(z.string()),
  invalid: z.array(z.string()),
});

export const retailReadinessSchema = z.object({
  contractVersion: z.literal(1),
  architectureStatus: z.enum(["pending_owner_approval", "approved"]),
  activated: z.boolean(),
  actions: z.object({
    quote: actionSchema,
    order: actionSchema,
    payment: actionSchema,
    refund: actionSchema,
  }),
  evaluatedAt: z.string(),
});

export type RetailReadiness = z.infer<typeof retailReadinessSchema>;

export type RetailBlockReason =
  | "readiness_unavailable"
  | "readiness_stale"
  | "unknown_action"
  | "architecture_pending_owner_approval"
  | "not_activated"
  | "settings_incomplete"
  | "readiness_inconsistent";

export type RetailActionDecision =
  { allowed: true } | { allowed: false; reason: RetailBlockReason; blockers: string[] };

const blocked = (reason: RetailBlockReason, blockers: string[] = []): RetailActionDecision => ({
  allowed: false,
  reason,
  blockers,
});

/** A readiness answer older than this is treated as unavailable rather than trusted. */
export const DEFAULT_MAX_READINESS_AGE_MS = 60_000;

/**
 * Decide whether one commercial action may proceed. Anything that is not a fresh, well-formed, internally
 * consistent "approved and activated and nothing missing" answer blocks the action.
 */
export function decideRetailAction(
  action: string,
  raw: unknown,
  options: { now?: Date; maxAgeMs?: number } = {},
): RetailActionDecision {
  if (!(RETAIL_ACTIONS as readonly string[]).includes(action)) return blocked("unknown_action");

  const parsed = retailReadinessSchema.safeParse(raw);
  if (!parsed.success) return blocked("readiness_unavailable");
  const readiness = parsed.data;

  const evaluatedAt = Date.parse(readiness.evaluatedAt);
  const now = (options.now ?? new Date()).getTime();
  const maxAge = options.maxAgeMs ?? DEFAULT_MAX_READINESS_AGE_MS;
  if (!Number.isFinite(evaluatedAt) || evaluatedAt > now + 5_000 || now - evaluatedAt > maxAge) {
    return blocked("readiness_stale");
  }

  const entry = readiness.actions[action as RetailAction];
  const blockers = [...entry.missing, ...entry.unapproved, ...entry.invalid];

  // Defence in depth: do not rely on Core's per-action flag alone.
  if (readiness.architectureStatus !== "approved")
    return blocked("architecture_pending_owner_approval", blockers);
  if (!readiness.activated) return blocked("not_activated", blockers);
  if (!entry.allowed) return blocked("settings_incomplete", blockers);
  if (blockers.length > 0) return blocked("readiness_inconsistent", blockers);

  return { allowed: true };
}

/** Convenience for call sites that have the readiness payload but may have failed to fetch it. */
export function retailActionAllowed(
  action: string,
  raw: unknown,
  options?: { now?: Date; maxAgeMs?: number },
): boolean {
  return decideRetailAction(action, raw, options).allowed;
}
