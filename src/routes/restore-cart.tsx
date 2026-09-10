/**
 * CART RECOVERY LANDING
 *
 * A recovery link carries only a signed, expiring token. Contents are verified
 * and re-priced server-side before the basket is restored, so a recovered cart
 * never carries a stale price or an unavailable item.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { redeemCartRecoveryLink } from "@/lib/cart-recovery.functions";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/restore-cart")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search["token"] === "string" ? (search["token"] as string) : "",
  }),
  head: () => ({
    meta: [
      { title: "Your saved basket — Oasis Baklawa" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Restore the basket you saved earlier." },
    ],
  }),
  component: RestoreCartPage,
});

type Phase = "checking" | "restored" | "invalid" | "unavailable";

function RestoreCartPage() {
  const { token } = Route.useSearch();
  const redeem = useServerFn(redeemCartRecoveryLink);
  const { replaceLines, ready } = useShop();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("");
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;

    if (!token) {
      setPhase("invalid");
      setMessage("This basket link isn’t valid.");
      return;
    }

    void (async () => {
      try {
        const result = await redeem({ data: { token } });
        if (result.status === "restored") {
          replaceLines(result.lines);
          setPhase("restored");
          track({ name: "cart_restored", params: { items: result.lines.length } });
        } else if (result.status === "unavailable") {
          // Honest: the link may well be fine, we just could not check it.
          setPhase("unavailable");
          setMessage(result.reason);
        } else {
          setPhase("invalid");
          setMessage(result.reason);
        }
      } catch {
        setPhase("unavailable");
        setMessage("We couldn’t check this basket link just now. Please try again shortly.");
      }
    })();
  }, [ready, token, redeem, replaceLines]);

  return (
    <div className="container-oasis section-y">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">Your basket</p>
        {phase === "checking" ? (
          <>
            <h1 className="mt-4 font-display text-4xl">Checking your saved basket…</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We’re confirming today’s prices and availability before restoring it.
            </p>
          </>
        ) : phase === "restored" ? (
          <>
            <h1 className="mt-4 font-display text-4xl">Your basket is back</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Everything has been re-checked against current prices and availability.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => void navigate({ to: "/cart" })}>View basket</Button>
              <Button variant="outline" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-4 font-display text-4xl">This basket link can’t be opened</h1>
            <p className="mt-3 text-sm text-muted-foreground">{message}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/shop">Browse the collection</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/cart">Go to basket</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
