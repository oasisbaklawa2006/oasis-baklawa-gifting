/**
 * EXPERIMENTATION / FEATURE FLAG ADAPTER
 *
 * Deterministic, hash-based assignment so server and client agree and nothing
 * flickers. Flags default off and resolve from local config; a remote provider
 * can replace the source later. No urgency, scarcity or other dark-pattern
 * experiments are supported by this boundary.
 */

import { registerAdapter, resolveAdapter } from "./registry";

export type Variant = string;

export type ExperimentDefinition = {
  key: string;
  variants: Variant[];
  /** Percentage weights aligned to `variants`; omitted means an even split. */
  weights?: number[];
  enabled: boolean;
};

export type FlagDefinition = { key: string; enabled: boolean };

/** Locally governed defaults. Every flag is off until an owner turns it on. */
export const localExperiments: ExperimentDefinition[] = [];
export const localFlags: FlagDefinition[] = [];

/** FNV-1a: stable across runtimes, so SSR and the browser assign identically. */
export function hashToUnit(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash / 0xffffffff;
}

export function assignVariant(
  experiment: ExperimentDefinition,
  subjectId: string,
): Variant | null {
  if (!experiment.enabled || experiment.variants.length === 0) return null;
  const point = hashToUnit(`${experiment.key}:${subjectId}`);
  const weights =
    experiment.weights ?? experiment.variants.map(() => 1 / experiment.variants.length);
  const total = weights.reduce((sum, weight) => sum + weight, 0) || 1;
  let cursor = 0;
  for (let index = 0; index < experiment.variants.length; index += 1) {
    cursor += (weights[index] ?? 0) / total;
    if (point <= cursor) return experiment.variants[index] ?? null;
  }
  return experiment.variants[experiment.variants.length - 1] ?? null;
}

export interface ExperimentAdapter {
  readonly provider: string;
  variant(key: string, subjectId: string): Variant | null;
  flag(key: string): boolean;
}

export const localExperimentAdapter: ExperimentAdapter = {
  provider: "local",
  variant(key, subjectId) {
    const experiment = localExperiments.find((item) => item.key === key);
    return experiment ? assignVariant(experiment, subjectId) : null;
  },
  flag(key) {
    return localFlags.find((item) => item.key === key)?.enabled ?? false;
  },
};

registerAdapter({
  id: "experiments:local",
  domain: "experiments",
  provider: "local",
  label: "Local feature flags & deterministic assignment",
  capabilities: ["feature-flags", "deterministic-variants", "ssr-safe"],
  requiredEnv: [],
  fallback: "All flags off, no experiment running.",
  isFallback: true,
});

registerAdapter({
  id: "experiments:remote",
  domain: "experiments",
  provider: "remote",
  label: "Remote flag provider (optional)",
  capabilities: ["remote-config", "targeting"],
  requiredEnv: ["FEATURE_FLAG_API_URL", "FEATURE_FLAG_API_KEY"],
  fallback: "Local flags and deterministic assignment.",
});

export function experimentAdapter(): ExperimentAdapter {
  // A remote provider still resolves through the local evaluator until wired,
  // so behaviour is identical and never flickers.
  resolveAdapter("experiments");
  return localExperimentAdapter;
}
