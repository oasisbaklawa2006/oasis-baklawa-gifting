/**
 * AFFILIATE / REFERRAL ADAPTER
 *
 * Provider-neutral attribution for referral and affiliate codes. No public
 * programme claims, rewards or discount percentages exist until Oasis
 * publishes rules; coupons stay with the commerce authority.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type ReferralAttribution = {
  campaignId?: string;
  code: string;
  /** When the code was first seen in this browser session. */
  seenAt: string;
};

export type ConversionInput = {
  code: string;
  orderReference: string;
  /** Only ever the authoritative order value from the server. */
  valueMinor: number;
};

export interface ReferralAdapter {
  readonly provider: string;
  resolveCode(code: string): Promise<AdapterResult<{ valid: boolean; campaignId?: string }>>;
  reportConversion(input: ConversionInput): Promise<AdapterResult<{ recorded: boolean }>>;
}

/** Codes are normalised so `OASIS-Gift`, `oasis gift` and `oasis_gift` match. */
export function normalizeReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_]+/g, "-").replace(/[^A-Z0-9-]/g, "");
}

const reported = new Set<string>();

/** Duplicate guard: one conversion per (code, order) pair, ever. */
export function isDuplicateConversion(input: ConversionInput): boolean {
  return reported.has(`${normalizeReferralCode(input.code)}:${input.orderReference}`);
}

export function markConversion(input: ConversionInput): void {
  reported.add(`${normalizeReferralCode(input.code)}:${input.orderReference}`);
}

export const localReferral: ReferralAdapter = {
  provider: "local",
  async resolveCode(code) {
    const normalized = normalizeReferralCode(code);
    // Validity is a commerce-authority decision; the site only records the code.
    return {
      ok: true,
      provider: "local",
      data: { valid: false, ...(normalized ? { campaignId: normalized } : {}) },
    };
  },
  async reportConversion(input) {
    if (isDuplicateConversion(input)) {
      return { ok: true, provider: "local", data: { recorded: false } };
    }
    markConversion(input);
    return { ok: true, provider: "local", data: { recorded: true } };
  },
};

const networkReferral: ReferralAdapter = {
  ...localReferral,
  provider: "network",
  async reportConversion() {
    return notConfigured<{ recorded: boolean }>(
      "network",
      "No affiliate network is configured. Required: AFFILIATE_NETWORK_URL, AFFILIATE_NETWORK_KEY.",
    );
  },
};

registerAdapter({
  id: "referral:local",
  domain: "referral",
  provider: "local",
  label: "Local referral attribution",
  capabilities: ["code-capture", "attribution", "duplicate-guard"],
  requiredEnv: [],
  fallback: "Codes are captured and attributed; validity and rewards stay with Oasis Central.",
  isFallback: true,
});

registerAdapter({
  id: "referral:network",
  domain: "referral",
  provider: "network",
  label: "Affiliate network (optional)",
  capabilities: ["code-resolution", "conversion-callback", "fraud-guard"],
  requiredEnv: ["AFFILIATE_NETWORK_URL", "AFFILIATE_NETWORK_KEY"],
  fallback: "Local attribution only.",
});

export function referralAdapter(): ReferralAdapter {
  return resolveAdapter("referral")?.provider === "network" ? networkReferral : localReferral;
}

/** Test helper. */
export function resetReferralConversions(): void {
  reported.clear();
}
