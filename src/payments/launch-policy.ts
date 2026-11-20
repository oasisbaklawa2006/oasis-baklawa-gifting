/**
 * Website payment operations remain fail-closed until Oasis Core has a verified
 * server-side order/amount authorization contract. Setting provider keys is
 * not permission to charge an unverified order.
 */
export const paymentLaunchPolicy = {
  operational: false,
  reason:
    "Online payment is not available until the verified order and amount handoff is certified.",
} as const;


/**
 * Server-side order submission gate, independent of page visibility or provider quoting.
 * A future authoritative commerce adapter must never enable order creation by itself:
 * the release owner must explicitly change the certified launch policy first.
 */
export function orderSubmissionHold(): { status: "unavailable"; reason: string } | null {
  if (paymentLaunchPolicy.operational) return null;
  return { status: "unavailable", reason: paymentLaunchPolicy.reason };
}
