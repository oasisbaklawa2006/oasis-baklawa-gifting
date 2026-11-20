import { Truck } from "lucide-react";

import { cn } from "@/lib/utils";

type Props = {
  /** Compact layout for product pages. */
  compact?: boolean;
  className?: string;
};

/**
 * GFT-100 F07: no online delivery promise may be generated from local mock PIN
 * routing. Restore a functional estimator only with a governed Core serviceability
 * and rate contract plus completed hosted acceptance evidence.
 */
export function DeliveryEstimator({ compact = false, className }: Props) {
  return (
    <section
      aria-label="Delivery availability"
      className={cn(
        "border border-border bg-utility",
        compact ? "rounded-sm p-5" : "p-6 md:p-8",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Truck className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
        <div className="min-w-0">
          <h3 className={cn("font-display", compact ? "text-lg" : "text-xl md:text-2xl")}>
            Confirm delivery availability
          </h3>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground" role="status">
            Live PIN-code eligibility, delivery dates, dispatch cut-offs and shipping charges
            are not yet available online. Please contact the Oasis team to confirm the
            destination and terms before placing an order.
          </p>
          <a
            href="/contact"
            className="mt-5 inline-flex min-h-11 items-center rounded-sm border border-border px-4 text-sm underline-offset-4 hover:underline"
          >
            Enquire about delivery
          </a>
        </div>
      </div>
    </section>
  );
}
