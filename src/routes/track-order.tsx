import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Package, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { OrderResult, toLookupOutcome, type LookupOutcome } from "@/components/oasis/order-tracking";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { track } from "@/lib/analytics";
import { lookupOrder } from "@/lib/commerce.functions";

const DESCRIPTION =
  "Track an Oasis Baklawa order: enter your order reference and the email or phone number used at checkout to see its current status.";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Delivery Status | Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Track Your Order — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: TrackOrderPage,
});

function TrackOrderPage() {
  const runLookup = useServerFn(lookupOrder);
  const [reference, setReference] = useState("");
  const [contact, setContact] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<LookupOutcome>({ kind: "idle" });
  const inFlight = useRef(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;

    const ref = reference.trim().toUpperCase();
    const who = contact.trim();
    if (ref.length < 4) {
      setFieldError("Enter the order reference from your confirmation email.");
      return;
    }
    if (who.length < 5) {
      setFieldError("Enter the email address or phone number used on the order.");
      return;
    }

    setFieldError(null);
    inFlight.current = true;
    setOutcome({ kind: "loading" });
    try {
      const result = await runLookup({ data: { reference: ref, contact: who } });
      setOutcome(toLookupOutcome(result));
      track({ name: "track_order", params: { found: result.status === "found" } });
    } catch {
      setOutcome({
        kind: "error",
        reason: "We couldn’t reach the order service just now. Please try again in a moment.",
      });
    } finally {
      inFlight.current = false;
    }
  }

  const busy = outcome.kind === "loading";

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Track order" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Order tracking"
          title="Where your order is"
          intro="Enter your order reference along with the email address or phone number used at checkout. We only show details to the person who placed the order — prices are never shown, so a tracking link is safe to pass to a recipient."
          action={
            <Button asChild variant="outline">
              <Link to="/shipping">Shipping & delivery</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12">
        <form onSubmit={submit} className="border border-border bg-utility p-6 md:p-8" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="tracking-reference" className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                Order reference
              </Label>
              <Input
                id="tracking-reference"
                name="reference"
                autoComplete="off"
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={fieldError ? "tracking-error" : undefined}
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label htmlFor="tracking-contact" className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                Email or phone used at checkout
              </Label>
              <Input
                id="tracking-contact"
                name="contact"
                autoComplete="email"
                value={contact}
                onChange={(event) => setContact(event.target.value)}
                aria-invalid={Boolean(fieldError)}
                className="mt-2 h-11"
              />
            </div>
          </div>
          <Button type="submit" className="mt-5 h-11" disabled={busy}>
            {busy ? "Checking…" : "Track order"}
          </Button>
          {fieldError ? (
            <p id="tracking-error" role="alert" className="mt-3 text-[0.8125rem] text-truffle">
              {fieldError}
            </p>
          ) : null}
        </form>
      </section>

      <section className="container-oasis mt-12" aria-live="polite">
        {outcome.kind === "idle" ? null : <OrderResult outcome={outcome} />}
      </section>

      <section className="container-oasis mt-12">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex gap-3 border border-border p-6">
            <Package className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg">Something looks wrong?</h2>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                If a parcel is delayed or arrives damaged, contact us with your reference and a photo of
                the box and we will put it right.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/support">Get help with an order</Link>
              </Button>
            </div>
          </div>
          <div className="flex gap-3 border border-border p-6">
            <Truck className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
            <div>
              <h2 className="font-display text-lg">Planning your next order?</h2>
              <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                Check the delivery window for your PIN code before you order, including cut-off times
                and available service levels.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link to="/shipping">Delivery estimator</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
