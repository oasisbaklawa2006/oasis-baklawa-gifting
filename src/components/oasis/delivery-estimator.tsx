import { useState } from "react";
import { Check, Clock, MapPin, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  estimateDelivery,
  findZoneByPincode,
  formatDeliveryDate,
  serviceLevels,
  type DeliveryEstimate,
  type ServiceLevelId,
} from "@/data/shipping";

type Props = {
  /** Compact layout for product pages. */
  compact?: boolean;
  className?: string;
};

export function DeliveryEstimator({ compact = false, className }: Props) {
  const [pincode, setPincode] = useState("");
  const [service, setService] = useState<ServiceLevelId>("standard");
  const [result, setResult] = useState<DeliveryEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const zone = findZoneByPincode(pincode);
  const available = zone ? serviceLevels.filter((s) => zone.services.includes(s.id)) : serviceLevels;

  function check(event: React.FormEvent) {
    event.preventDefault();
    const digits = pincode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setResult(null);
      setError("Enter a 6-digit PIN code.");
      return;
    }
    const nextZone = findZoneByPincode(digits);
    const nextService: ServiceLevelId =
      nextZone && !nextZone.services.includes(service) ? "standard" : service;
    setService(nextService);
    const estimate = estimateDelivery(digits, nextService);
    if (!estimate) {
      setResult(null);
      setError("We could not estimate this route. Please contact us and we will confirm manually.");
      return;
    }
    setError(null);
    setResult(estimate);
  }

  return (
    <div
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
            Check delivery time
          </h3>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            Enter a PIN code for an indicative dispatch and delivery window. Estimates in this build
            are illustrative.
          </p>
        </div>
      </div>

      <form onSubmit={check} className="mt-5" noValidate>
        <div className={cn("grid gap-3", compact ? "sm:grid-cols-[1fr_auto]" : "sm:grid-cols-[220px_1fr_auto]")}>
          <div>
            <Label htmlFor={`pincode-${compact ? "compact" : "full"}`} className="sr-only">
              Delivery PIN code
            </Label>
            <Input
              id={`pincode-${compact ? "compact" : "full"}`}
              name="pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              placeholder="6-digit PIN code"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/[^0-9]/g, ""))}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `pincode-error-${compact ? "c" : "f"}` : undefined}
              className="h-11"
            />
          </div>

          {!compact ? (
            <div>
              <Label htmlFor="service-level" className="sr-only">
                Service level
              </Label>
              <select
                id="service-level"
                value={service}
                onChange={(e) => setService(e.target.value as ServiceLevelId)}
                className="h-11 w-full rounded-sm border border-input bg-background px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                {available.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button type="submit" className="h-11">
            Check
          </Button>
        </div>

        {error ? (
          <p
            id={`pincode-error-${compact ? "c" : "f"}`}
            role="alert"
            className="mt-3 text-[0.8125rem] text-truffle"
          >
            {error}
          </p>
        ) : null}
      </form>

      <div aria-live="polite">
        {result ? (
          <div className="mt-6 border-t border-border pt-5">
            <p className="eyebrow">{result.zone.name}</p>
            <p className="mt-3 font-display text-xl">
              Arriving {formatDeliveryDate(result.earliest)}
              {formatDeliveryDate(result.earliest) === formatDeliveryDate(result.latest)
                ? ""
                : ` – ${formatDeliveryDate(result.latest)}`}
            </p>
            <ul className="mt-4 grid gap-2 text-[0.8125rem] text-muted-foreground sm:grid-cols-2">
              <li className="flex items-center gap-2">
                <Clock className="size-3.5 shrink-0 text-driftwood" aria-hidden="true" />
                {result.madeCutoff
                  ? `Dispatching today — order before ${result.cutoffLabel}`
                  : `Today's ${result.cutoffLabel} cut-off has passed — dispatching ${formatDeliveryDate(result.dispatchDate)}`}
              </li>
              <li className="flex items-center gap-2">
                <Truck className="size-3.5 shrink-0 text-driftwood" aria-hidden="true" />
                {result.service.name} · {result.service.feeNote}
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0 text-driftwood" aria-hidden="true" />
                {result.zone.blurb}
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 shrink-0 text-driftwood" aria-hidden="true" />
                Tracked end to end, no Sunday dispatch
              </li>
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
