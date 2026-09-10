/**
 * PUSH NOTIFICATION ADAPTER
 *
 * Nothing here ever asks the browser for permission on its own: a prompt may
 * only follow a user-initiated action AND a configured provider. Without a
 * provider, subscription is simply unavailable.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import { adapterStatus, getAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type PushCategory = "transactional" | "marketing";

export type PushPermission = "default" | "granted" | "denied" | "unsupported";

export type PushSubscriptionRecord = {
  endpoint: string;
  deviceToken?: string;
  categories: PushCategory[];
  createdAt: string;
};

export type PushMessage = {
  title: string;
  body: string;
  category: PushCategory;
  /** In-app deep link path, e.g. `/order/OB-123`. */
  deepLink?: string;
};

export interface PushAdapter {
  readonly provider: string;
  permissionState(): PushPermission;
  /** MUST only be called from a user gesture and with a configured provider. */
  subscribe(categories: PushCategory[]): Promise<AdapterResult<PushSubscriptionRecord>>;
  unsubscribe(endpoint: string): Promise<AdapterResult<{ removed: boolean }>>;
  send(endpoint: string, message: PushMessage): Promise<AdapterResult<{ queued: boolean }>>;
}

export function readPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

/** True only when a real provider is configured. Guards every prompt. */
export function canPrompt(): boolean {
  const descriptor = resolveAdapter("push");
  return Boolean(
    descriptor && !descriptor.isFallback && adapterStatus(descriptor) === "configured",
  );
}

export const disabledPush: PushAdapter = {
  provider: "none",
  permissionState: readPermission,
  async subscribe() {
    return notConfigured<PushSubscriptionRecord>(
      "none",
      "No push provider is configured, so no permission is requested and no subscription is created.",
    );
  },
  async unsubscribe() {
    return { ok: true, provider: "none", data: { removed: true } };
  },
  async send() {
    return notConfigured<{ queued: boolean }>("none", "No push provider is configured.");
  },
};

const boundary = (provider: string, label: string, env: readonly string[]): PushAdapter => ({
  ...disabledPush,
  provider,
  async subscribe() {
    return notConfigured<PushSubscriptionRecord>(
      provider,
      `${label} is not configured. Required: ${env.join(", ")}.`,
    );
  },
});

const boundaries: Record<string, PushAdapter> = {
  webpush: boundary("webpush", "Web Push (VAPID)", [
    "VITE_WEB_PUSH_PUBLIC_KEY",
    "WEB_PUSH_PRIVATE_KEY",
  ]),
  firebase: boundary("firebase", "Firebase Cloud Messaging", [
    "VITE_FIREBASE_CONFIG",
    "FIREBASE_SERVER_KEY",
  ]),
  apns: boundary("apns", "Apple Push (future native app)", [
    "APNS_TEAM_ID",
    "APNS_KEY_ID",
    "APNS_PRIVATE_KEY",
  ]),
};

registerAdapter({
  id: "push:none",
  domain: "push",
  provider: "none",
  label: "Push disabled",
  capabilities: ["permission-read"],
  requiredEnv: [],
  fallback: "No permission prompt is ever shown and no device is registered.",
  isFallback: true,
});

for (const [provider, label, env] of [
  ["webpush", "Web Push / VAPID", ["VITE_WEB_PUSH_PUBLIC_KEY", "WEB_PUSH_PRIVATE_KEY"]],
  ["firebase", "Firebase Cloud Messaging", ["VITE_FIREBASE_CONFIG", "FIREBASE_SERVER_KEY"]],
  ["apns", "Apple Push Notification service", ["APNS_TEAM_ID", "APNS_KEY_ID", "APNS_PRIVATE_KEY"]],
] as const) {
  registerAdapter({
    id: `push:${provider}`,
    domain: "push",
    provider,
    label,
    capabilities: ["subscribe", "unsubscribe", "categories", "deep-link"],
    requiredEnv: env,
    fallback: "Push stays disabled.",
  });
}

export function pushAdapter(): PushAdapter {
  const descriptor = resolveAdapter("push");
  if (!descriptor || descriptor.provider === "none") return disabledPush;
  const chosen = boundaries[descriptor.provider] ?? disabledPush;
  return getAdapter(descriptor.id) ? chosen : disabledPush;
}
