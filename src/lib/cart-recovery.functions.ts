/**
 * Server boundary for cart recovery: issuing links and redeeming them.
 *
 * Every issued link is recorded durably (`public.cart_recovery_sessions`)
 * against a hash of the token — the token itself is never stored. Redemption
 * always re-prices and re-validates through the commerce provider, so a
 * recovery link can never resurrect a stale price or an unavailable item.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { commerce } from "@/commerce";

const lineSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});

export type IssueResult =
  | { status: "issued"; token: string; path: string }
  | { status: "unavailable"; reason: string };

export const issueCartRecoveryLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ cartId: z.string().min(6), lines: z.array(lineSchema).min(1) }).parse(input),
  )
  .handler(async ({ data }): Promise<IssueResult> => {
    const { issueRecoveryToken, hashRecoveryToken, recoveryExpiry } = await import(
      "./cart-recovery-token.server"
    );
    const { recoveryRepository } = await import("./persistence/index.server");

    const token = issueRecoveryToken(data.cartId, data.lines);
    const stored = await recoveryRepository().record({
      tokenHash: hashRecoveryToken(token),
      cartId: data.cartId,
      lines: data.lines,
      expiresAt: recoveryExpiry(token),
    });

    // Fail honestly: a link we could not record must never be handed out.
    if (!stored.ok) {
      return {
        status: "unavailable",
        reason: "We couldn’t save your basket link just now. Please try again shortly.",
      };
    }

    return { status: "issued", token, path: `/restore-cart?token=${encodeURIComponent(token)}` };
  });

export type RedeemResult =
  | {
      status: "restored";
      cartId: string;
      lines: { productId: string; variantId: string; quantity: number }[];
      pricing: Awaited<ReturnType<typeof commerce.priceCart>>;
    }
  | { status: "invalid"; reason: string }
  | { status: "unavailable"; reason: string };

export const redeemCartRecoveryLink = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ token: z.string().min(10) }).parse(input))
  .handler(async ({ data }): Promise<RedeemResult> => {
    const { verifyRecoveryToken, hashRecoveryToken } = await import("./cart-recovery-token.server");
    const { recoveryRepository } = await import("./persistence/index.server");

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

    // The durable session is authoritative for validity, expiry and state.
    const claimed = await recoveryRepository().claim(hashRecoveryToken(data.token));
    if (!claimed.ok) {
      if (claimed.reason === "unavailable") {
        return {
          status: "unavailable",
          reason: "We couldn’t check this basket link just now. Please try again shortly.",
        };
      }
      return {
        status: "invalid",
        reason:
          claimed.reason === "expired"
            ? "This basket link has expired. Please add your items again — we’ve kept everything else."
            : "This basket link isn’t valid.",
      };
    }

    const lines = claimed.session.lines.length ? claimed.session.lines : verified.payload.lines;

    // Authoritative repricing/validation before anything is shown or checked out.
    const pricing = await commerce.priceCart(lines, {});
    return {
      status: "restored",
      cartId: claimed.session.cartId,
      lines,
      pricing,
    };
  });
