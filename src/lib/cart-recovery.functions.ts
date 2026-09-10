/**
 * Server boundary for cart recovery: issuing links and redeeming them.
 * Redemption always re-prices and re-validates through the commerce provider —
 * a recovery link can never resurrect a stale price or an unavailable item.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { commerce } from "@/commerce";

const lineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export const issueCartRecoveryLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ cartId: z.string().min(6), lines: z.array(lineSchema).min(1) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { issueRecoveryToken } = await import("./cart-recovery-token.server");
    const token = issueRecoveryToken(data.cartId, data.lines);
    return { token, path: `/restore-cart?token=${encodeURIComponent(token)}` };
  });

export type RedeemResult =
  | {
      status: "restored";
      cartId: string;
      lines: { productId: string; variantId: string; quantity: number }[];
      pricing: Awaited<ReturnType<typeof commerce.priceCart>>;
    }
  | { status: "invalid"; reason: string };

export const redeemCartRecoveryLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data }): Promise<RedeemResult> => {
    const { verifyRecoveryToken } = await import("./cart-recovery-token.server");
    const verified = verifyRecoveryToken(data.token);
    if (!verified.ok) {
      return {
        status: "invalid",
        reason:
          verified.reason === "expired"
            ? "This basket link has expired. Please add your items again — we’ve kept everything else."
            : "This basket link isn’t valid.",
      };
    }

    // Authoritative repricing/validation before anything is shown or checked out.
    const pricing = await commerce.priceCart(verified.payload.lines, {});
    return {
      status: "restored",
      cartId: verified.payload.cartId,
      lines: verified.payload.lines,
      pricing,
    };
  });
