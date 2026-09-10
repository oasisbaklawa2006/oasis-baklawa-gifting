/**
 * SUPPORT / HELPDESK ADAPTER
 *
 * Appverse/Trace remains the ticket authority. Helpdesk SaaS is a replaceable
 * front door: it may create and mirror tickets, never own order truth.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type TicketStatus = "open" | "pending_customer" | "resolved" | "closed";

export type TicketInput = {
  subject: string;
  body: string;
  email: string;
  orderReference?: string;
  reasonId: string;
  attachments?: { filename: string; sizeBytes: number; contentType: string }[];
};

export type Ticket = { ticketId: string; status: TicketStatus; createdAt: string };

export interface SupportAdapter {
  readonly provider: string;
  createTicket(input: TicketInput): Promise<AdapterResult<Ticket>>;
  appendMessage(
    ticketId: string,
    body: string,
    visibility: "public" | "internal",
  ): Promise<AdapterResult<{ appended: boolean }>>;
  setStatus(ticketId: string, status: TicketStatus): Promise<AdapterResult<{ status: TicketStatus }>>;
  normalizeWebhook(payload: unknown): { ticketId: string; status: TicketStatus } | null;
}

export function normalizeTicketStatus(raw: string | null | undefined): TicketStatus | null {
  const value = String(raw ?? "").toLowerCase();
  if (/open|new/.test(value)) return "open";
  if (/pending|waiting|hold/.test(value)) return "pending_customer";
  if (/solved|resolved/.test(value)) return "resolved";
  if (/closed/.test(value)) return "closed";
  return null;
}

export const appverseSupport: SupportAdapter = {
  provider: "appverse",
  async createTicket() {
    return notConfigured<Ticket>(
      "appverse",
      "Support requests are recorded locally and emailed to the Oasis team; Appverse/Trace is not connected.",
    );
  },
  async appendMessage() {
    return notConfigured<{ appended: boolean }>("appverse", "Ticket threads need Appverse/Trace.");
  },
  async setStatus() {
    return notConfigured<{ status: TicketStatus }>("appverse", "Status is owned by Appverse/Trace.");
  },
  normalizeWebhook(payload) {
    if (!payload || typeof payload !== "object") return null;
    const record = payload as Record<string, unknown>;
    const ticketId = record["ticketId"] ?? record["id"];
    const status = normalizeTicketStatus(String(record["status"] ?? ""));
    return typeof ticketId === "string" && status ? { ticketId, status } : null;
  },
};

const boundary = (provider: string, label: string, env: readonly string[]): SupportAdapter => ({
  ...appverseSupport,
  provider,
  async createTicket() {
    return notConfigured<Ticket>(provider, `${label} is not configured. Required: ${env.join(", ")}.`);
  },
});

const boundaries: Record<string, SupportAdapter> = {
  gorgias: boundary("gorgias", "Gorgias", ["GORGIAS_DOMAIN", "GORGIAS_API_KEY"]),
  zendesk: boundary("zendesk", "Zendesk", ["ZENDESK_SUBDOMAIN", "ZENDESK_API_TOKEN"]),
  freshdesk: boundary("freshdesk", "Freshdesk", ["FRESHDESK_DOMAIN", "FRESHDESK_API_KEY"]),
};

registerAdapter({
  id: "support:appverse",
  domain: "support",
  provider: "appverse",
  label: "Oasis Central / Trace tickets (primary)",
  capabilities: ["create", "append", "status", "webhook"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "The existing support form records the request and shows the Oasis contact channels.",
  isFallback: true,
});

for (const [provider, label, env] of [
  ["gorgias", "Gorgias (optional)", ["GORGIAS_DOMAIN", "GORGIAS_API_KEY"]],
  ["zendesk", "Zendesk (optional)", ["ZENDESK_SUBDOMAIN", "ZENDESK_API_TOKEN"]],
  ["freshdesk", "Freshdesk (optional)", ["FRESHDESK_DOMAIN", "FRESHDESK_API_KEY"]],
] as const) {
  registerAdapter({
    id: `support:${provider}`,
    domain: "support",
    provider,
    label,
    capabilities: ["create", "append", "attachments", "public-reply", "webhook"],
    requiredEnv: env,
    fallback: "The existing support form records the request locally.",
  });
}

export function supportAdapter(): SupportAdapter {
  const descriptor = resolveAdapter("support");
  if (!descriptor || descriptor.provider === "appverse") return appverseSupport;
  return boundaries[descriptor.provider] ?? appverseSupport;
}
