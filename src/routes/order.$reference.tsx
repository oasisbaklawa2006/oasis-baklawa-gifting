import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, LifeBuoy, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import {
  OrderResult,
  toLookupOutcome,
  type LookupOutcome,
} from "@/components/oasis/order-tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupOrder } from "@/lib/commerce.functions";
import { loadOrderRefs } from "@/lib/account";

export const Route = createFileRoute("/order/$reference")({
  head: () => ({
    meta: [
      { title: "Your Order — Oasis Baklawa" },
      { name: "description", content: "Your Oasis Baklawa order confirmation and current status." },
      { property: "og:title", content: "Your Order — Oasis Baklawa" },
      { property: "og:description", content: "Order confirmation and status." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OrderPage,
});

/**
 * Deep-link and refresh safe order screen. No customer detail is carried in the
 * URL: the reference alone is not enough, so the page re-verifies with the
 * contact stored on this device or asks for it.
 */
function OrderPage() {
  const { reference } = useParams({ from: "/order/$reference" });
  const runLookup = useServerFn(lookupOrder);
  const [contact, setContact] = useState("");
  const [outcome, setOutcome] = useState<LookupOutcome>({ kind: "idle" });
  const inFlight = useRef(false);

  async function check(who: string) {
    if (inFlight.current || who.trim().length < 5) return;
    inFlight.current = true;
    setOutcome({ kind: "loading" });
    try {
      const result = await runLookup({ data: { reference, contact: who.trim() } });
      setOutcome(toLookupOutcome(result));
    } catch {
      setOutcome({
        kind: "error",
        reason: "We couldn’t reach the order service. Please try again.",
      });
    } finally {
      inFlight.current = false;
    }
  }

  // Refresh-safe: reuse the contact this browser already saved for the order.
  useEffect(() => {
    const saved = loadOrderRefs().find((entry) => entry.reference === reference);
    if (saved?.contact) {
      setContact(saved.contact);
      void check(saved.contact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Your order" }]} />

      <header className="mt-6 max-w-2xl">
        <p className="eyebrow">Order</p>
        <h1 className="mt-3 text-3xl md:text-[2.5rem]">Thank you — your order is with us</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Your reference is{" "}
          <span className="font-medium text-foreground tabular-nums">{reference}</span>. Keep it
          handy for any question about this order.
        </p>
      </header>

      <section className="mt-10" aria-live="polite">
        {outcome.kind === "idle" ? (
          <form
            className="max-w-md border border-border bg-utility p-6"
            onSubmit={(event) => {
              event.preventDefault();
              void check(contact);
            }}
          >
            <Label
              htmlFor="order-contact"
              className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood"
            >
              Confirm the email or phone used on this order
            </Label>
            <Input
              id="order-contact"
              className="mt-2 h-11"
              value={contact}
              autoComplete="email"
              onChange={(event) => setContact(event.target.value)}
            />
            <Button type="submit" className="mt-4 h-11">
              Show my order
            </Button>
          </form>
        ) : (
          <OrderResult outcome={outcome} />
        )}
      </section>

      <section className="mt-12 grid gap-5 md:grid-cols-3">
        <div className="flex gap-3 border border-border p-6">
          <Truck className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg">Follow your parcel</h2>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
              Status updates appear here and on the tracking page as your order moves.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/track-order">Track order</Link>
            </Button>
          </div>
        </div>
        <div className="flex gap-3 border border-border p-6">
          <Gift className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg">Gift another occasion</h2>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
              Browse the gifting collections or start a new box whenever you need one.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/gifting">Gifting</Link>
            </Button>
          </div>
        </div>
        <div className="flex gap-3 border border-border p-6">
          <LifeBuoy className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
          <div>
            <h2 className="font-display text-lg">Need help?</h2>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
              Tell us what happened and our team will take it from there.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link to="/support" search={{ reference }}>
                Get help
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
