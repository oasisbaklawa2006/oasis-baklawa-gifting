/** Provider-specific webhook verification; never accept one generic signature format. */
import { verifyRazorpayWebhook, verifyStripeWebhook } from "./signatures";

export type WebhookProvider = "razorpay" | "stripe";

export function verifyIncomingWebhook(
  provider: WebhookProvider,
  body: string,
  headers: { razorpay?: string | null; stripe?: string | null },
  secret: string,
): boolean {
  if (!secret) return false;
  if (provider === "razorpay") {
    return verifyRazorpayWebhook(body, headers.razorpay ?? "", secret);
  }
  return verifyStripeWebhook(body, headers.stripe ?? "", secret);
}
