import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Circle, Package, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  formatDeliveryDate,
  lookupTracking,
  sampleTrackingReference,
  trackingStages,
  type TrackingResult,
} from "@/data/shipping";

const DESCRIPTION =
  "Track an Oasis Baklawa order: enter your OB- reference for dispatch status, courier stage and an estimated delivery date.";

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
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setSearched(true);
    const found = lookupTracking(reference);
    if (!found) {
      setResult(null);
      setError("That reference doesn't look right. It begins with OB- followed by 4–10 characters.");
      return;
    }
    setError(null);
    setResult(found);
  }

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
          intro="Enter the reference from your dispatch email. Tracking in this build is a demonstration — try the sample reference below."
          action={
            <Button asChild variant="outline">
              <Link to="/shipping">Shipping & delivery</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12">
        <form onSubmit={submit} className="border border-border bg-utility p-6 md:p-8" noValidate>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,320px)_auto]">
            <div>
              <Label htmlFor="tracking-reference" className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                Order or tracking reference
              </Label>
              <Input
                id="tracking-reference"
                name="reference"
                placeholder={sampleTrackingReference}
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "tracking-error" : "tracking-hint"}
                className="mt-2 h-11"
              />
            </div>
            <Button type="submit" className="h-11 self-end">
              Track order
            </Button>
          </div>
          <p id="tracking-hint" className="mt-3 text-[0.8125rem] text-muted-foreground">
            Sample reference for this demo:{" "}
            <button
              type="button"
              onClick={() => setReference(sampleTrackingReference)}
              className="text-foreground underline decoration-gold/70 underline-offset-4"
            >
              {sampleTrackingReference}
            </button>
          </p>
          {error ? (
            <p id="tracking-error" role="alert" className="mt-3 text-[0.8125rem] text-truffle">
              {error}
            </p>
          ) : null}
        </form>
      </section>

      <div aria-live="polite">
        {result ? (
          <>
            <section className="container-oasis mt-12">
              <div className="grid gap-6 border border-border bg-premium p-6 md:grid-cols-3 md:p-8">
                <div>
                  <p className="eyebrow">Reference</p>
                  <p className="mt-2 font-display text-xl">{result.reference}</p>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">{result.carrier}</p>
                </div>
                <div>
                  <p className="eyebrow">Current status</p>
                  <p className="mt-2 font-display text-xl">{result.status}</p>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                    {result.service.name} · {result.zone.name}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">Estimated delivery</p>
                  <p className="mt-2 font-display text-xl">{formatDeliveryDate(result.estimatedDelivery)}</p>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">Indicative, excludes Sundays</p>
                </div>
              </div>
            </section>

            <section className="container-oasis mt-10">
              <ol className="grid gap-0">
                {result.events.map((event, i) => {
                  const isCurrent = i === result.currentStageIndex;
                  const Icon = event.complete ? Check : Circle;
                  return (
                    <li key={event.stageId} className="grid grid-cols-[auto_1fr] gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full border",
                            event.complete
                              ? "border-olive bg-olive text-primary-foreground"
                              : "border-border bg-background text-driftwood",
                          )}
                          aria-hidden="true"
                        >
                          <Icon className="size-3.5" />
                        </span>
                        {i < result.events.length - 1 ? (
                          <span
                            className={cn(
                              "w-px flex-1",
                              event.complete ? "bg-olive/50" : "bg-border",
                            )}
                            aria-hidden="true"
                          />
                        ) : null}
                      </div>
                      <div className={cn("pb-8", !event.complete && "opacity-60")}>
                        <p className="font-display text-lg">
                          {event.label}
                          {isCurrent ? (
                            <span className="ml-3 align-middle text-[0.6875rem] uppercase tracking-[0.16em] text-olive">
                              Current
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                          {event.description}
                        </p>
                        <p className="mt-2 text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                          {event.location}
                          {event.complete
                            ? ` · ${event.timestamp.toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : " · Pending"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="container-oasis mt-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="flex gap-3 border border-border p-6">
                  <Package className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-lg">Something looks wrong?</h2>
                    <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                      If a parcel is delayed or arrives damaged, contact us within 48 hours with your
                      reference and a photo of the box.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/contact">Contact support</Link>
                    </Button>
                  </div>
                </div>
                <div className="flex gap-3 border border-border p-6">
                  <Truck className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                  <div>
                    <h2 className="font-display text-lg">Planning your next order?</h2>
                    <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                      Check the delivery window for your PIN code before you order, including cut-off
                      times and available service levels.
                    </p>
                    <Button asChild variant="outline" className="mt-4">
                      <Link to="/shipping">Delivery estimator</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {searched && !result && error ? (
          <section className="container-oasis mt-12">
            <EmptyState
              title="No shipment found"
              description={`References look like ${sampleTrackingReference}. Check your dispatch email, or contact us and we will look it up.`}
              action={
                <Button asChild>
                  <Link to="/contact">Contact us</Link>
                </Button>
              }
            />
          </section>
        ) : null}
      </div>

      {!result ? (
        <section className="container-oasis section-y">
          <SectionHeading eyebrow="What happens next" title="Every order moves through six stages" />
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trackingStages.map((stage, i) => (
              <li key={stage.id} className="border border-border p-6">
                <p className="text-[0.75rem] uppercase tracking-[0.16em] text-driftwood">
                  Stage {i + 1}
                </p>
                <h3 className="mt-2 font-display text-lg">{stage.label}</h3>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {stage.description}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
