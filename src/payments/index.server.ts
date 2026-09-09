/**
 * Payment adapter resolution. Razorpay is primary, Stripe secondary; the
 * active provider is a configuration decision, not a code decision.
 */

import { razorpayAdapter } from "./razorpay.server";
import { stripeAdapter } from "./stripe.server";
import type { PaymentAdapter, PaymentProviderName } from "./types";

export const adapters: Record<PaymentProviderName, PaymentAdapter> = {
  razorpay: razorpayAdapter,
  stripe: stripeAdapter,
};

/** Preference order; the first configured adapter wins. */
export const providerPreference: PaymentProviderName[] = ["razorpay", "stripe"];

export function resolvePaymentAdapter(): PaymentAdapter | null {
  const requested = (process.env["PAYMENT_PROVIDER"] ?? "").trim() as PaymentProviderName;
  if (requested && adapters[requested]?.isConfigured()) return adapters[requested]!;
  for (const name of providerPreference) {
    if (adapters[name].isConfigured()) return adapters[name];
  }
  return null;
}

export function paymentReadiness() {
  return providerPreference.map((name) => ({
    provider: name,
    configured: adapters[name].isConfigured(),
  }));
}
