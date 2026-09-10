/**
 * Anonymous client + session identifiers.
 *
 * These are first-party, non-identifying and used only to correlate a visit's
 * events. No email, phone or name ever enters this module.
 */

const CLIENT_KEY = "oasis.cid.v1";
const SESSION_KEY = "oasis.sid.v1";

function randomId(prefix: string): string {
  const globalCrypto = typeof crypto !== "undefined" ? crypto : undefined;
  const raw =
    globalCrypto && typeof globalCrypto.randomUUID === "function"
      ? globalCrypto.randomUUID().replace(/-/g, "")
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `${prefix}_${raw}`;
}

export function clientId(): string {
  if (typeof window === "undefined") return "cid_server";
  try {
    const existing = window.localStorage.getItem(CLIENT_KEY);
    if (existing) return existing;
    const created = randomId("cid");
    window.localStorage.setItem(CLIENT_KEY, created);
    return created;
  } catch {
    return randomId("cid");
  }
}

export function sessionId(): string {
  if (typeof window === "undefined") return "sid_server";
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = randomId("sid");
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId("sid");
  }
}
