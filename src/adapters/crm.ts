/**
 * CRM / LEAD ADAPTER
 *
 * Appverse/Central is the primary destination for every enquiry. External CRM
 * is optional and never authoritative. Leads are normalised and de-duplicated
 * on a single key before they leave the site; internal sales notes and stages
 * are never exposed to a public surface.
 */

import { registerAdapter, recordError, recordSuccess, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type LeadStage = "new" | "qualified" | "in_conversation" | "won" | "lost";

export type NormalizedLead = {
  /** Deterministic dedupe key: `${kind}:${email|digits-only phone}`. */
  key: string;
  kind: string;
  email?: string;
  phone?: string;
  name?: string;
  company?: string;
  message?: string;
  source: string;
  /** Non-identifying campaign attribution only. */
  attribution: Record<string, string>;
  consent: { marketing: boolean; timestamp: string };
};

export type LeadInput = Omit<NormalizedLead, "key">;

export function normalizeLead(input: LeadInput): NormalizedLead {
  const email = input.email?.trim().toLowerCase() || undefined;
  const phone = input.phone?.replace(/[^0-9]/g, "") || undefined;
  const identity = email ?? phone ?? "";
  return {
    ...input,
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
    key: `${input.kind}:${identity}`,
  };
}

/** True when two submissions describe the same person on the same surface. */
export function isDuplicateLead(a: LeadInput, b: LeadInput): boolean {
  return normalizeLead(a).key === normalizeLead(b).key && Boolean(normalizeLead(a).key.split(":")[1]);
}

export interface CRMAdapter {
  readonly provider: string;
  upsertLead(lead: NormalizedLead): Promise<AdapterResult<{ crmId?: string; stage: LeadStage }>>;
  normalizeWebhook(payload: unknown): { key: string; stage: LeadStage } | null;
}

export const appverseCrm: CRMAdapter = {
  provider: "appverse",
  async upsertLead(lead) {
    return notConfigured<{ crmId?: string; stage: LeadStage }>(
      "appverse",
      `Lead ${lead.key} is queued locally. Appverse CRM is not connected (APPVERSE_BASE_URL, APPVERSE_API_KEY).`,
    );
  },
  normalizeWebhook(payload) {
    if (!payload || typeof payload !== "object") return null;
    const record = payload as Record<string, unknown>;
    const key = record["key"];
    const stage = String(record["stage"] ?? "").toLowerCase();
    const valid: LeadStage[] = ["new", "qualified", "in_conversation", "won", "lost"];
    if (typeof key !== "string" || !valid.includes(stage as LeadStage)) return null;
    return { key, stage: stage as LeadStage };
  },
};

function boundary(provider: string, label: string, env: readonly string[]): CRMAdapter {
  return {
    ...appverseCrm,
    provider,
    async upsertLead() {
      return notConfigured<{ crmId?: string; stage: LeadStage }>(
        provider,
        `${label} is not configured. Required: ${env.join(", ")}.`,
      );
    },
  };
}

const boundaries: Record<string, CRMAdapter> = {
  hubspot: boundary("hubspot", "HubSpot", ["HUBSPOT_ACCESS_TOKEN"]),
  zoho: boundary("zoho", "Zoho CRM", ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"]),
  klaviyo: boundary("klaviyo", "Klaviyo profile sync", ["KLAVIYO_PRIVATE_KEY"]),
};

registerAdapter({
  id: "crm:appverse",
  domain: "crm",
  provider: "appverse",
  label: "Oasis Central / Appverse CRM (primary)",
  capabilities: ["lead-upsert", "attribution", "stage", "owner", "consent", "webhook"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "Leads stay in the local queue marked pending_sync.",
  isFallback: true,
});

for (const [provider, label, env] of [
  ["hubspot", "HubSpot (optional)", ["HUBSPOT_ACCESS_TOKEN"]],
  ["zoho", "Zoho CRM (optional)", ["ZOHO_CLIENT_ID", "ZOHO_CLIENT_SECRET", "ZOHO_REFRESH_TOKEN"]],
  ["klaviyo", "Klaviyo profile sync (optional)", ["KLAVIYO_PRIVATE_KEY"]],
] as const) {
  registerAdapter({
    id: `crm:${provider}`,
    domain: "crm",
    provider,
    label,
    capabilities: ["lead-upsert", "attribution", "consent", "webhook"],
    requiredEnv: env,
    fallback: "Leads stay in the local queue marked pending_sync.",
  });
}

export function crmAdapter(): CRMAdapter {
  const descriptor = resolveAdapter("crm");
  if (!descriptor || descriptor.provider === "appverse") return appverseCrm;
  return boundaries[descriptor.provider] ?? appverseCrm;
}

export async function syncLead(input: LeadInput) {
  const adapter = crmAdapter();
  const result = await adapter.upsertLead(normalizeLead(input));
  if (result.ok) recordSuccess(`crm:${adapter.provider}`);
  else recordError(`crm:${adapter.provider}`, result.detail);
  return result;
}
