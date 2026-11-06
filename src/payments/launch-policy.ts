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
