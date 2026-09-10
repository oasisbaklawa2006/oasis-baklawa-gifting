/**
 * ADDRESS / GEOCODING ADAPTER
 *
 * India-first, international-ready. Validation here is *format* confidence
 * only: a well-formed address is not a promise of delivery. Serviceability is
 * always a separate question answered by the shipping adapter or Appverse.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type AddressInput = {
  line1: string;
  line2?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode: string;
  country: string;
};

export type AddressValidation = {
  normalized: AddressInput;
  /** 0–1 confidence in the *format*, never in deliverability. */
  confidence: number;
  issues: string[];
  /** Always false here: only shipping/Appverse may answer this. */
  serviceabilityKnown: false;
};

export type PlaceSuggestion = { id: string; description: string };

export interface AddressAdapter {
  readonly provider: string;
  validate(input: AddressInput): Promise<AdapterResult<AddressValidation>>;
  suggest(query: string, country?: string): Promise<AdapterResult<PlaceSuggestion[]>>;
  geocode(placeId: string): Promise<AdapterResult<{ lat: number; lng: number }>>;
}

const IN_PIN = /^[1-9][0-9]{5}$/;

export function normalizePostalCode(raw: string, country: string): string {
  const trimmed = raw.trim().toUpperCase().replace(/\s+/g, " ");
  return country.toUpperCase() === "IN" ? trimmed.replace(/[^0-9]/g, "") : trimmed;
}

export function validateAddressLocally(input: AddressInput): AddressValidation {
  const country = (input.country || "IN").toUpperCase();
  const postalCode = normalizePostalCode(input.postalCode, country);
  const issues: string[] = [];
  if (!input.line1.trim()) issues.push("Street address is required.");
  if (!input.city?.trim()) issues.push("City is required.");
  if (!input.state?.trim()) issues.push("State is required.");
  if (country === "IN" && !IN_PIN.test(postalCode)) issues.push("Enter a valid 6-digit PIN code.");
  if (country !== "IN" && postalCode.length < 3) issues.push("Enter a valid postal code.");

  const filled = [input.line1, input.city, input.state, postalCode].filter((v) =>
    Boolean(v?.trim()),
  ).length;
  return {
    normalized: { ...input, postalCode, country },
    confidence: issues.length ? Math.max(0, 0.4 - issues.length * 0.1) : Math.min(1, filled / 4),
    issues,
    serviceabilityKnown: false,
  };
}

export const localAddress: AddressAdapter = {
  provider: "local",
  async validate(input) {
    return { ok: true, provider: "local", data: validateAddressLocally(input) };
  },
  async suggest() {
    return notConfigured<PlaceSuggestion[]>(
      "local",
      "Address suggestions need a maps provider; customers can type the address instead.",
    );
  },
  async geocode() {
    return notConfigured<{ lat: number; lng: number }>("local", "Geocoding needs a maps provider.");
  },
};

const googleAddress: AddressAdapter = {
  ...localAddress,
  provider: "google",
  async suggest() {
    return notConfigured<PlaceSuggestion[]>(
      "google",
      "Google Places is not configured. Required: VITE_GOOGLE_MAPS_BROWSER_KEY, GOOGLE_MAPS_API_KEY.",
    );
  },
};

registerAdapter({
  id: "address:local",
  domain: "address",
  provider: "local",
  label: "Manual address validator",
  capabilities: ["postal-normalisation", "format-validation"],
  requiredEnv: [],
  fallback: "Always available. Format checks only — never implies delivery eligibility.",
  isFallback: true,
});

registerAdapter({
  id: "address:google",
  domain: "address",
  provider: "google",
  label: "Google Places / Geocoding",
  capabilities: ["autocomplete", "geocoding", "locality-suggestion"],
  requiredEnv: ["GOOGLE_MAPS_API_KEY"],
  fallback: "Falls back to the manual validator; customers type the address.",
});

export function addressAdapter(): AddressAdapter {
  const descriptor = resolveAdapter("address");
  return descriptor?.provider === "google" ? googleAddress : localAddress;
}
