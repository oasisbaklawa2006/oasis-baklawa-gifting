import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Plus } from "lucide-react";

import { SectionHeading } from "@/components/oasis/section-heading";
import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { products } from "@/data/catalog";
import {
  GIFT_MESSAGE_MAX,
  giftBoxFormats,
  perPiecePrice,
  ribbonFinishes,
  sealFinishes,
} from "@/data/gifting";
import { noImage } from "@/data/brand";
import { canonicalUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/build-a-gift")({
  head: () => ({
    meta: [
      { title: "Build a Gift — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Choose a box or chest, select confections compartment by compartment, and finish with a ribbon, seal and gift card message.",
      },
      { property: "og:title", content: "Build a Gift — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Compose a bespoke Oasis gift box, compartment by compartment.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("/build-a-gift") },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/build-a-gift") }],
  }),
  component: BuildAGiftPage,
});

const steps = ["Format", "Confections", "Arrangement", "Finishing"] as const;

function BuildAGiftPage() {
  const [step, setStep] = useState(0);
  const [formatId, setFormatId] = useState(giftBoxFormats[1]!.id);
  const [selection, setSelection] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [ribbonId, setRibbonId] = useState(ribbonFinishes[0]!.id);
  const [sealId, setSealId] = useState(sealFinishes[0]!.id);
  const [conceal, setConceal] = useState(false);

  const format = giftBoxFormats.find((f) => f.id === formatId) ?? giftBoxFormats[1]!;
  const choices = useMemo(
    () => products.filter((p) => p.categoryId !== "cat-gifting").slice(0, 12),
    [],
  );

  const used = Object.values(selection).reduce((s, n) => s + n, 0);
  const remaining = format.capacity - used;

  const ribbon = ribbonFinishes.find((r) => r.id === ribbonId)!;
  const seal = sealFinishes.find((s) => s.id === sealId)!;

  const total = {
    amount:
      format.basePrice.amount + used * perPiecePrice.amount + ribbon.surcharge + seal.surcharge,
    currency: format.basePrice.currency,
  };

  const adjust = (id: string, delta: number) => {
    setSelection((prev) => {
      const next = { ...prev };
      const value = (next[id] ?? 0) + delta;
      if (delta > 0 && remaining <= 0) return prev;
      if (value <= 0) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const compartments = Array.from({ length: format.capacity }, (_, i) => i);
  const filledLabels = Object.entries(selection).flatMap(([id, count]) =>
    Array.from({ length: count }, () => products.find((p) => p.id === id)?.name ?? ""),
  );

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Build a Gift" }]} />
      </div>

      <section className="container-oasis pb-6 pt-8">
        <SectionHeading
          eyebrow="Bespoke gifting"
          title="Build a gift"
          as="h1"
          intro="Choose a format, fill each compartment, then finish it. This is a front-end demonstrator — pricing and contents are illustrative until the governed catalogue and production system are connected."
        />
        <ol className="mt-10 flex flex-wrap gap-x-6 gap-y-3" aria-label="Progress">
          {steps.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 text-[0.8125rem] transition-colors duration-200 ease-out",
                  i === step ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-full border text-xs tabular-nums",
                    i === step ? "border-espresso bg-espresso text-background" : "border-border",
                  )}
                >
                  {i < step ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                </span>
                {label}
              </button>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-oasis grid gap-10 pb-20 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
        <div className="min-w-0">
          {step === 0 ? (
            <fieldset>
              <legend className="eyebrow">Step 1 — Box or chest</legend>
              <p className="mt-3 text-sm text-muted-foreground">\n                Selections reset if they exceed the new box capacity.\n              </p>\n              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {giftBoxFormats.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      if (f.capacity < used) {
                        setSelection({});
                      }
                      setFormatId(f.id);
                    }}
                    aria-pressed={f.id === formatId}
                    className={cn(
                      "rounded-sm border p-5 text-left transition-colors duration-200 ease-out",
                      f.id === formatId
                        ? "border-espresso bg-premium"
                        : "border-border hover:border-driftwood",
                    )}
                  >
                    <p className="eyebrow">{f.format === "chest" ? "Chest" : "Box"}</p>
                    <p className="mt-2 font-display text-xl">{f.name}</p>
                    <p className="mt-1 text-[0.8125rem] text-muted-foreground">{f.description}</p>
                    <p className="mt-4 text-[0.875rem] tabular-nums">
                      {f.capacity} compartments · from {formatMoney(f.basePrice)}
                    </p>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === 1 ? (
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="eyebrow">Step 2 — Choose confections</p>
                <p
                  aria-live="polite"
                  className="text-[0.8125rem] tabular-nums text-muted-foreground"
                >
                  {used} of {format.capacity} compartments filled
                </p>
              </div>
              <ul className="mt-5 grid gap-4 sm:grid-cols-2">
                {choices.map((p) => {
                  const count = selection[p.id] ?? 0;
                  return (
                    <li
                      key={p.id}
                      className={cn(
                        "flex items-center gap-4 rounded-sm border p-3",
                        count > 0 ? "border-espresso bg-premium" : "border-border",
                      )}
                    >
                      <img
                        src={p.images[0]?.src ?? noImage.src}
                        alt=""
                        width={160}
                        height={160}
                        loading="lazy"
                        className="size-16 shrink-0 rounded-sm object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-[0.9375rem]">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.categoryCue}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjust(p.id, -1)}
                          disabled={count === 0}
                          aria-label={`Remove one ${p.name}`}
                          className="grid size-11 place-items-center rounded-sm border border-border disabled:opacity-40"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center text-sm tabular-nums">{count}</span>
                        <button
                          type="button"
                          onClick={() => adjust(p.id, 1)}
                          disabled={remaining <= 0}
                          aria-label={`Add one ${p.name}`}
                          className="grid size-11 place-items-center rounded-sm border border-border disabled:opacity-40"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <p className="eyebrow">Step 3 — Arrangement preview</p>
              <p className="mt-3 text-[0.875rem] text-muted-foreground">
                A simplified view of the compartments. Final layout is set in production.
              </p>
              <div
                className="mt-6 grid gap-2 rounded-sm border border-border bg-premium p-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.round(Math.sqrt(format.capacity))}, minmax(0, 1fr))`,
                }}
              >
                {compartments.map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-sm border p-1 text-center text-[0.5625rem] leading-tight",
                      filledLabels[i]
                        ? "border-gold/60 bg-background text-foreground"
                        : "border-dashed border-border text-muted-foreground",
                    )}
                  >
                    {filledLabels[i] ?? "Empty"}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="max-w-xl">
              <p className="eyebrow">Step 4 — Finishing</p>
              <label className="mt-5 block text-[0.875rem] font-medium" htmlFor="gift-message">
                Gift card message
              </label>
              <Textarea
                id="gift-message"
                value={message}
                maxLength={GIFT_MESSAGE_MAX}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="mt-2"
                placeholder="Written by hand onto the gift card."
              />
              <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                {message.length} / {GIFT_MESSAGE_MAX}
              </p>

              <div className="mt-6 rounded-sm border border-border bg-card p-6">
                <p className="eyebrow">Card preview</p>
                <p className="mt-3 whitespace-pre-wrap font-display text-lg leading-relaxed">
                  {message || "Your message will appear here."}
                </p>
              </div>

              <fieldset className="mt-8">
                <legend className="eyebrow">Ribbon</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {ribbonFinishes.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRibbonId(r.id)}
                      aria-pressed={r.id === ribbonId}
                      className={cn(
                        "h-12 rounded-sm border px-4 text-[0.8125rem] transition-colors duration-200 ease-out",
                        r.id === ribbonId
                          ? "border-espresso bg-espresso text-background"
                          : "border-border",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-6">
                <legend className="eyebrow">Seal</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sealFinishes.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSealId(s.id)}
                      aria-pressed={s.id === sealId}
                      className={cn(
                        "h-12 rounded-sm border px-4 text-[0.8125rem] transition-colors duration-200 ease-out",
                        s.id === sealId
                          ? "border-espresso bg-espresso text-background"
                          : "border-border",
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-6 flex items-start gap-3 text-[0.875rem]">
                <Checkbox
                  checked={conceal}
                  onCheckedChange={(v) => setConceal(v === true)}
                  className="mt-0.5"
                />
                <span>
                  This order is a gift — conceal prices and invoice slips from the shipping parcel.
                </span>
              </label>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap gap-3">
            <Button
              variant="outline"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                Continue
              </Button>
            ) : (
              <Button disabled>Gift ordering unavailable</Button>
            )}
          </div>
          {step === steps.length - 1 ? (
            <p className="mt-3 text-sm text-muted-foreground" role="status">
              This is a composition preview only. Selections and finishing cannot be saved to an
              order until the Core-authoritative gifting quotation contract is connected.
            </p>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-sm border border-border bg-premium p-6">
            <p className="eyebrow">Your gift</p>
            <p className="mt-3 font-display text-xl">{format.name}</p>
            <dl className="mt-5 grid gap-2 text-[0.875rem]">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Format</dt>
                <dd>{format.capacity} compartments</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Filled</dt>
                <dd className="tabular-nums">{used}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Ribbon</dt>
                <dd className="text-right">{ribbon.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Seal</dt>
                <dd className="text-right">{seal.label}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Invoice</dt>
                <dd className="text-right">{conceal ? "Concealed" : "Included"}</dd>
              </div>
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-border pt-4">
              <span className="eyebrow">Indicative total</span>
              <span className="font-medium tabular-nums">{formatMoney(total)}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Illustrative pricing only. Final pricing will come from the governed catalogue and
              bill of materials.
            </p>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link to="/gifting">Browse ready-made gifts</Link>
            </Button>
          </div>
        </aside>
      </section>
    </>
  );
}
