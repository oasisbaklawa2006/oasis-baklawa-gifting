/**
 * IDENTITY ADAPTER
 *
 * Existing account behaviour is unchanged. This boundary only describes how a
 * provider identity (email/OTP today, Google or Apple later) maps onto ONE
 * Oasis customer reference, which is issued and owned server-side by Oasis
 * Central. OAuth secrets never reach the browser.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type IdentityProviderId = "email_otp" | "google" | "apple";

export type ProviderIdentity = {
  provider: IdentityProviderId;
  /** Provider's stable subject id, or the normalised email for OTP. */
  subject: string;
  email?: string;
  emailVerified: boolean;
};

export type CustomerLink = {
  /** Oasis-owned customer reference. Only the server may issue this. */
  oasisCustomerId: string;
  identities: ProviderIdentity[];
};

export interface IdentityAdapter {
  readonly provider: IdentityProviderId;
  startChallenge(identifier: string): Promise<AdapterResult<{ challengeId: string }>>;
  verify(challengeId: string, code: string): Promise<AdapterResult<ProviderIdentity>>;
}

/** Deterministic mapping key used to link an identity to one customer. */
export function identityKey(identity: ProviderIdentity): string {
  const subject =
    identity.provider === "email_otp"
      ? identity.subject.trim().toLowerCase()
      : identity.subject.trim();
  return `${identity.provider}:${subject}`;
}

export const emailOtpIdentity: IdentityAdapter = {
  provider: "email_otp",
  async startChallenge() {
    return notConfigured<{ challengeId: string }>(
      "email_otp",
      "Sign-in codes need a messaging provider; none is configured.",
    );
  },
  async verify() {
    return notConfigured<ProviderIdentity>(
      "email_otp",
      "Verification is performed by Oasis Central once connected.",
    );
  },
};

const social = (
  provider: IdentityProviderId,
  label: string,
  env: readonly string[],
): IdentityAdapter => ({
  provider,
  async startChallenge() {
    return notConfigured<{ challengeId: string }>(
      provider,
      `${label} is not configured. Required: ${env.join(", ")}.`,
    );
  },
  async verify() {
    return notConfigured<ProviderIdentity>(provider, `${label} is not configured.`);
  },
});

const boundaries: Record<string, IdentityAdapter> = {
  google: social("google", "Google sign-in", [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
  ]),
  apple: social("apple", "Apple sign-in", ["APPLE_OAUTH_CLIENT_ID", "APPLE_OAUTH_PRIVATE_KEY"]),
};

registerAdapter({
  id: "identity:email_otp",
  domain: "identity",
  provider: "email_otp",
  label: "Email / OTP sign-in (primary)",
  capabilities: ["challenge", "verify", "customer-link"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "The current guest account convenience experience is unchanged.",
  isFallback: true,
});

registerAdapter({
  id: "identity:google",
  domain: "identity",
  provider: "google",
  label: "Google sign-in (optional)",
  capabilities: ["oauth", "customer-link"],
  requiredEnv: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"],
  fallback: "Email/OTP sign-in.",
});

registerAdapter({
  id: "identity:apple",
  domain: "identity",
  provider: "apple",
  label: "Apple sign-in (optional)",
  capabilities: ["oauth", "customer-link"],
  requiredEnv: ["APPLE_OAUTH_CLIENT_ID", "APPLE_OAUTH_PRIVATE_KEY"],
  fallback: "Email/OTP sign-in.",
});

export function identityAdapter(): IdentityAdapter {
  const provider = resolveAdapter("identity")?.provider ?? "email_otp";
  return boundaries[provider] ?? emailOtpIdentity;
}
