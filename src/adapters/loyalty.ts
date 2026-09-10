/**
 * LOYALTY / OASIS REWARDS ADAPTER
 *
 * No programme rules exist yet, so this adapter invents nothing: no points,
 * tiers, earning rates, expiry or benefits. Until Oasis publishes rules and
 * Appverse owns balances, `/rewards` keeps its interest-registration
 * experience and every balance query honestly reports "no programme".
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type LoyaltyProgramme = {
  /** Only ever populated from governed Oasis configuration. */
  name: string;
  tiers: { id: string; label: string }[];
  earning: { description: string }[];
};

export type LoyaltyBalance = {
  customerId: string;
  points: number;
  tierId?: string;
  expiringSoon?: { points: number; on: string };
};

export interface LoyaltyAdapter {
  readonly provider: string;
  /** Null means: no programme is configured. The UI must not imply one. */
  programme(): Promise<AdapterResult<LoyaltyProgramme | null>>;
  balance(customerId: string): Promise<AdapterResult<LoyaltyBalance>>;
  redeem(input: {
    customerId: string;
    points: number;
    orderReference: string;
  }): Promise<AdapterResult<{ redeemed: boolean }>>;
  registerInterest(input: { email: string }): Promise<AdapterResult<{ registered: boolean }>>;
}

export const noLoyalty: LoyaltyAdapter = {
  provider: "none",
  async programme() {
    return { ok: true, provider: "none", data: null };
  },
  async balance() {
    return notConfigured<LoyaltyBalance>(
      "none",
      "Oasis Rewards has no published programme yet, so no balance exists.",
    );
  },
  async redeem() {
    return notConfigured<{ redeemed: boolean }>("none", "Redemption needs a published programme.");
  },
  async registerInterest() {
    // Interest capture is handled by the existing lead flow on /rewards.
    return { ok: true, provider: "none", data: { registered: true } };
  },
};

const appverseLoyalty: LoyaltyAdapter = {
  ...noLoyalty,
  provider: "appverse",
  async programme() {
    return notConfigured<LoyaltyProgramme | null>(
      "appverse",
      "Appverse loyalty is not connected. Required: APPVERSE_BASE_URL, APPVERSE_API_KEY.",
    );
  },
};

registerAdapter({
  id: "loyalty:none",
  domain: "loyalty",
  provider: "none",
  label: "No rewards programme configured",
  capabilities: ["interest-registration"],
  requiredEnv: [],
  fallback: "The /rewards page keeps its interest-registration experience only.",
  isFallback: true,
});

registerAdapter({
  id: "loyalty:appverse",
  domain: "loyalty",
  provider: "appverse",
  label: "Oasis Central / Appverse loyalty (preferred authority)",
  capabilities: ["balance", "tiers", "redemption", "referral-link"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "Interest registration only.",
});

registerAdapter({
  id: "loyalty:saas",
  domain: "loyalty",
  provider: "saas",
  label: "External loyalty SaaS (optional)",
  capabilities: ["points", "membership", "referrals", "redemption"],
  requiredEnv: ["LOYALTY_PROVIDER_URL", "LOYALTY_PROVIDER_KEY"],
  fallback: "Interest registration only. Never authoritative for orders.",
});

export function loyaltyAdapter(): LoyaltyAdapter {
  const descriptor = resolveAdapter("loyalty");
  return descriptor && descriptor.provider !== "none" ? appverseLoyalty : noLoyalty;
}
