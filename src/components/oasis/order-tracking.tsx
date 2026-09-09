/**
 * Shared order lookup + timeline. Renders only what the order connector
 * actually returns: no sample orders, no invented delivery dates, no prices.
 */

import { Link } from "@tanstack/react-router";
import { Check, Circle, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { mapOrderStage, stageMeta, timelineFor, type OrderStage } from "@/lib/order-status";
import { cn } from "@/lib/utils";

export type LookupOutcome =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not-found"; reason: string }
  | { kind: "error"; reason: string }
  | {
      kind: "found";
      orderReference: string;
      stage: OrderStage | null;
      rawStage: string;
      placedAt: string;
      trackingUrl?: string;
      courier?: string;
    };

export function toLookupOutcome(
  result: {
    status: "unknown" | "found";
    reason?: string;
    orderReference?: string;
    stage?: string;
    placedAt?: string;
    trackingUrl?: string;
    courier?: string;
  },
): LookupOutcome {
  if (result.status === "found" && result.orderReference) {
    return {
      kind: "found",
      orderReference: result.orderReference,
      stage: mapOrderStage(result.stage),
      rawStage: result.stage ?? "",
      placedAt: result.placedAt ?? "",
      ...(result.trackingUrl ? { trackingUrl: result.trackingUrl } : {}),
      ...(result.courier ? { courier: result.courier } : {}),
    };
  }
  return { kind: "not-found", reason: result.reason ?? "We couldn’t find that order." };
}

function formatDate(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderTimeline({ stage }: { stage: OrderStage }) {
  const meta = stageMeta(stage);

  if (!meta.onTimeline) {
    return (
      <div className="border border-border bg-premium p-6">
        <p className="eyebrow">Status</p>
        <p className="mt-2 font-display text-xl">{meta.label}</p>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{meta.description}</p>
      </div>
    );
  }

  return (
    <ol className="grid gap-0">
      {timelineFor(stage).map((step, index, all) => (
        <li key={step.meta.stage} className="grid grid-cols-[auto_1fr] gap-4">
          <div className="flex flex-col items-center">
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border",
                step.complete
                  ? "border-olive bg-olive text-primary-foreground"
                  : "border-border bg-background text-driftwood",
              )}
              aria-hidden="true"
            >
              {step.complete ? <Check className="size-3.5" /> : <Circle className="size-3.5" />}
            </span>
            {index < all.length - 1 ? (
              <span className={cn("w-px flex-1", step.complete ? "bg-olive/50" : "bg-border")} aria-hidden="true" />
            ) : null}
          </div>
          <div className={cn("pb-8", !step.complete && "opacity-60")}>
            <p className="font-display text-lg">
              {step.meta.label}
              {step.current ? (
                <span className="ml-3 align-middle text-[0.6875rem] uppercase tracking-[0.16em] text-olive">
                  Now
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
              {step.meta.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function OrderResult({ outcome }: { outcome: LookupOutcome }) {
  if (outcome.kind === "loading") {
    return (
      <p className="flex items-center gap-2 text-[0.9375rem] text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        Looking up your order…
      </p>
    );
  }

  if (outcome.kind === "not-found" || outcome.kind === "error") {
    return (
      <div className="border border-border bg-utility p-6">
        <p className="font-display text-lg">
          {outcome.kind === "error" ? "We couldn’t complete that check" : "No order found"}
        </p>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{outcome.reason}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/contact">Contact our team</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/faq">Delivery questions</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (outcome.kind !== "found") return null;

  const placed = formatDate(outcome.placedAt);

  return (
    <div className="space-y-10">
      <div className="grid gap-6 border border-border bg-premium p-6 md:grid-cols-3 md:p-8">
        <div>
          <p className="eyebrow">Reference</p>
          <p className="mt-2 font-display text-xl tabular-nums">{outcome.orderReference}</p>
          {placed ? <p className="mt-1 text-[0.8125rem] text-muted-foreground">Placed {placed}</p> : null}
        </div>
        <div>
          <p className="eyebrow">Status</p>
          <p className="mt-2 font-display text-xl">
            {outcome.stage ? stageMeta(outcome.stage).label : "With our team"}
          </p>
          {outcome.courier ? (
            <p className="mt-1 text-[0.8125rem] text-muted-foreground">Courier: {outcome.courier}</p>
          ) : null}
        </div>
        <div>
          <p className="eyebrow">Courier tracking</p>
          {outcome.trackingUrl ? (
            <a
              href={outcome.trackingUrl}
              rel="noopener noreferrer"
              target="_blank"
              className="mt-2 inline-block font-display text-xl underline decoration-gold/70 underline-offset-4"
            >
              Open tracking
            </a>
          ) : (
            <p className="mt-2 text-[0.875rem] text-muted-foreground">
              A tracking link appears here once the courier collects your parcel.
            </p>
          )}
        </div>
      </div>

      {outcome.stage ? <OrderTimeline stage={outcome.stage} /> : null}
    </div>
  );
}
