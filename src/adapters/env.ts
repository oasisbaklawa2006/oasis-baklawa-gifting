/**
 * ADAPTER ENVIRONMENT ACCESS
 *
 * Adapters may only ever learn whether a key *exists*, never print its value.
 * `VITE_*` names are client-safe selection values. Every other name is a
 * server secret and is only readable inside server code.
 */

export const isServer = typeof window === "undefined";

function viteEnv(key: string): string {
  const env = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const value = env ? (env[key] as string | undefined) : undefined;
  return (value ?? "").trim();
}

function nodeEnv(key: string): string {
  if (!isServer || typeof process === "undefined" || !process.env) return "";
  return (process.env[key] ?? "").trim();
}

/** Client-safe value (selection flags, public IDs). Empty when unset. */
export function publicValue(key: string): string {
  return key.startsWith("VITE_") ? viteEnv(key) : "";
}

/**
 * Server-only value. Returns "" in the browser by construction, so a secret
 * can never be bundled into client code through this helper.
 */
export function secretValue(key: string): string {
  return isServer ? nodeEnv(key) : "";
}

/** True when the key has a non-empty value in the current runtime. */
export function envPresent(key: string): boolean {
  if (key.startsWith("VITE_")) return Boolean(viteEnv(key));
  return Boolean(nodeEnv(key));
}

/** All names in `keys` are present. An empty list means "nothing required". */
export function allPresent(keys: readonly string[]): boolean {
  return keys.every(envPresent);
}
