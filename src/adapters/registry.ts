/**
 * ADAPTER REGISTRY
 *
 * A single typed inventory of every replaceable external boundary, its
 * capabilities, the environment key NAMES it needs, and its fallback
 * behaviour. Selection is configuration, never code: `VITE_ADAPTER_<DOMAIN>`
 * (or the server twin) names the preferred provider, and the domain's
 * built-in fallback is used whenever that provider is unavailable.
 */

import { allPresent, publicValue, secretValue } from "./env";
import type {
  AdapterDescriptor,
  AdapterDomain,
  AdapterHealth,
  AdapterReport,
  AdapterStatus,
} from "./types";

const descriptors = new Map<string, AdapterDescriptor>();
const health = new Map<string, AdapterHealth>();

export function registerAdapter(descriptor: AdapterDescriptor): AdapterDescriptor {
  descriptors.set(descriptor.id, descriptor);
  return descriptor;
}

export function listAdapters(domain?: AdapterDomain): AdapterDescriptor[] {
  const all = [...descriptors.values()];
  return domain ? all.filter((d) => d.domain === domain) : all;
}

export function getAdapter(id: string): AdapterDescriptor | undefined {
  return descriptors.get(id);
}

function selectionKey(domain: AdapterDomain): string {
  return `ADAPTER_${domain.replace(/-/g, "_").toUpperCase()}`;
}

/** The provider name an owner has selected for a domain, if any. */
export function selectedProviderName(domain: AdapterDomain): string {
  const key = selectionKey(domain);
  return (publicValue(`VITE_${key}`) || secretValue(key)).toLowerCase();
}

export function adapterStatus(descriptor: AdapterDescriptor): AdapterStatus {
  const record = health.get(descriptor.id);
  const configured = descriptor.requiredEnv.length === 0 || allPresent(descriptor.requiredEnv);
  if (descriptor.isFallback && descriptor.requiredEnv.length === 0) return "built-in";
  if (!configured) return "not-configured";
  if (record?.lastErrorAt && (!record.lastSuccessAt || record.lastErrorAt > record.lastSuccessAt)) {
    return "degraded";
  }
  return "configured";
}

/**
 * Resolve the adapter to use for a domain. A selected provider is only used
 * when it is fully configured; otherwise the domain's fallback is returned so
 * the site always keeps working.
 */
export function resolveAdapter(domain: AdapterDomain): AdapterDescriptor | undefined {
  const candidates = listAdapters(domain);
  const wanted = selectedProviderName(domain);
  if (wanted) {
    const match = candidates.find((c) => c.provider === wanted);
    if (match && adapterStatus(match) !== "not-configured") return match;
  }
  const configured = candidates.find((c) => !c.isFallback && adapterStatus(c) === "configured");
  return configured ?? candidates.find((c) => c.isFallback) ?? candidates[0];
}

export function recordSuccess(id: string): void {
  health.set(id, { ...health.get(id), lastSuccessAt: new Date().toISOString() });
}

export function recordError(id: string, detail: string): void {
  health.set(id, {
    ...health.get(id),
    lastErrorAt: new Date().toISOString(),
    lastError: detail.slice(0, 240),
  });
}

export function adapterHealth(id: string): AdapterHealth {
  return health.get(id) ?? {};
}

/** Full report for the private admin surface. Names only — never values. */
export function adapterReport(): AdapterReport[] {
  const selectedIds = new Set(
    [...new Set([...descriptors.values()].map((d) => d.domain))]
      .map((domain) => resolveAdapter(domain)?.id)
      .filter((id): id is string => Boolean(id)),
  );
  return [...descriptors.values()]
    .map((descriptor) => ({
      ...descriptor,
      // Functions are not serialisable across the RPC boundary.
      testConnection: undefined,
      status: adapterStatus(descriptor),
      selected: selectedIds.has(descriptor.id),
      health: adapterHealth(descriptor.id),
    }))
    .sort((a, b) => a.domain.localeCompare(b.domain) || a.provider.localeCompare(b.provider));
}

/** Test helper: clears recorded health only, never the descriptors. */
export function resetAdapterHealth(): void {
  health.clear();
}
