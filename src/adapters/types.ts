/**
 * ADAPTER CAPABILITY MODEL
 *
 * One vocabulary for every replaceable external system. Oasis Central /
 * Appverse remains the operational authority for products, prices, stock,
 * customers, orders, fulfilment and finance. Everything described here is an
 * orchestration boundary: swappable, optional, and never source of truth
 * unless it is explicitly the native/Appverse adapter.
 */

export type AdapterDomain =
  | "communications"
  | "push"
  | "shipping"
  | "address"
  | "search"
  | "recommendations"
  | "reviews"
  | "loyalty"
  | "crm"
  | "lead-store"
  | "support"
  | "tax"
  | "sales-channel"
  | "referral"
  | "experiments"
  | "identity"
  | "observability"
  | "media"
  | "content"
  | "webhooks";

/**
 * `built-in`  — works with no credentials (local/native fallback).
 * `configured` — every required environment key is present.
 * `not-configured` — a provider boundary exists but keys are missing.
 * `degraded` — configured, but the last call failed.
 */
export type AdapterStatus = "built-in" | "configured" | "not-configured" | "degraded";

export type AdapterDescriptor = {
  /** Stable id: `${domain}:${provider}`. */
  id: string;
  domain: AdapterDomain;
  provider: string;
  label: string;
  capabilities: readonly string[];
  /** Environment variable NAMES only. Values are never read here. */
  requiredEnv: readonly string[];
  /** What happens when this adapter is unavailable. */
  fallback: string;
  /** True for the always-working local/native implementation of a domain. */
  isFallback?: boolean;
  /** Server-side connectivity probe, only meaningful once credentials exist. */
  testConnection?: () => Promise<{ ok: boolean; detail: string }>;
};

export type AdapterHealth = {
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
};

export type AdapterReport = AdapterDescriptor & {
  status: AdapterStatus;
  selected: boolean;
  health: AdapterHealth;
};

/** Result shape shared by every outbound adapter call. */
export type AdapterResult<T = unknown> =
  | { ok: true; provider: string; data: T }
  | { ok: false; provider: string; reason: AdapterFailureReason; detail: string };

export type AdapterFailureReason =
  "not_configured" | "unsupported" | "invalid_input" | "provider_error" | "not_authoritative";

export function notConfigured<T>(provider: string, detail: string): AdapterResult<T> {
  return { ok: false, provider, reason: "not_configured", detail };
}
