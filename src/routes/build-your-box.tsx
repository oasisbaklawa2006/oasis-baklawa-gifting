import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { products } from "@/data/catalog";
import { hamperBoxes, hamperExtras, inr, ribbonColours } from "@/data/checkout";
import { formatMoney } from "@/lib/format";
import { noImage } from "@/data/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/build-your-box")({
  head: () => ({
    meta: [
      { title: "Build Your Own Box & Hamper — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Choose a box size, pick your baklawa and Arabic sweets, add a ribbon, message card and extras — a hamper made exactly to your taste.",
      },
      { property: "og:title", content: "Build Your Own Box — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Compose a bespoke baklawa hamper: box size, selections, ribbon and message card.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BuildYourBoxPage,
});

/** Per-slot selection: one unit of a product's smallest variant. */
type Selection = Record<string, number>;

function BuildYourBoxPage() {
  const [boxId, setBoxId] = useState(hamperBoxes[1]!.id);
  const [selection, setSelection] = useState<Selection>({});
  const [extras, setExtras] = useState<string[]>([]);
  const [ribbon, setRibbon] = useState(ribbonColours[0]!.id);
  const [message, setMessage] = useState("");

  const box = hamperBoxes.find((option) => option.id === boxId)!;
  const filled = useMemo(
    () => Object.values(selection).reduce((sum, count) => sum + count, 0),
    [selection],
  );
  const remaining = Math.max(0, box.slots - filled);

  const itemsTotal = useMemo(
    () =>
      Object.entries(selection).reduce((sum, [productId, count]) => {
        const product = products.find((item) => item.id === productId);
        const price = product?.variants[0]?.price.amount ?? 0;
        return sum + price * count;
      }, 0),
    [selection],
  );

  const extrasTotal = useMemo(
    () =>
      hamperExtras
        .filter((extra) => extras.includes(extra.id))
        .reduce((sum, extra) => sum + extra.fee, 0),
    [extras],
  );

  const total = box.fee + itemsTotal + extrasTotal;

  const adjust = (productId: string, delta: number) => {
    setSelection((current) => {
      const count = current[productId] ?? 0;
      const selectedCount = Object.values(current).reduce((sum, quantity) => sum + quantity, 0);
      if (delta > 0 && selectedCount + delta > box.slots) {
        toast("Box is full", { description: `The ${box.name} holds ${box.slots} selections.` });
        return current;
      }
      const next = Math.max(0, count + delta);
      const updated = { ...current };
      if (next === 0) delete updated[productId];
      else updated[productId] = next;
      return updated;
    });
  };

  const toggleExtra = (id: string) =>
    setExtras((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const changeBox = (id: string) => {
    const next = hamperBoxes.find((option) => option.id === id)!;
    if (filled > next.slots) {
      const confirmed = window.confirm(
        "This smaller box cannot fit your selected sweets. Changing boxes will clear your selection. Continue?",
      );
      if (!confirmed) return;
      setSelection({});
    }
    setBoxId(id);
  };

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Build your own box" }]} />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Bespoke gifting</p>
        <h1 className="mt-3 text-3xl md:text-[2.75rem]">Build your own box</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Choose a size, fill it with the sweets you like, then finish it with a ribbon, a
          handwritten card and any extras. Roughly ten minutes, start to finish.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="space-y-14">
          <section aria-label="Choose a box">
            <SectionHeading eyebrow="Step 1" title="Choose your box" />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {hamperBoxes.map((option) => {
                const selected = option.id === boxId;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => changeBox(option.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 border p-5 text-left transition-colors",
                      selected
                        ? "border-foreground bg-premium"
                        : "border-border hover:border-driftwood",
                    )}
                  >
                    <span className="font-display text-lg">{option.name}</span>
                    <span className="eyebrow">{option.slots} selections</span>
                    <span className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                    <span className="mt-3 text-[0.875rem] tabular-nums">
                      Packaging {formatMoney(inr(option.fee))}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Fill your box">
            <SectionHeading
              eyebrow="Step 2"
              title="Fill your box"
              intro={
                remaining > 0
                  ? `${remaining} of ${box.slots} selections remaining.`
                  : "Your box is full — adjust a selection to swap something out."
              }
            />
            <ul className="mt-6 grid gap-px border border-border bg-border sm:grid-cols-2">
              {products.map((product) => {
                const count = selection[product.id] ?? 0;
                const variant = product.variants[0]!;
                return (
                  <li key={product.id} className="flex gap-4 bg-canvas p-4">
                    <img
                      src={product.images[0]?.src ?? noImage.src}
                      alt={product.images[0]?.alt ?? ""}
                      width={160}
                      height={200}
                      loading="lazy"
                      className="aspect-[4/5] w-20 shrink-0 rounded-sm object-cover"
                    />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="eyebrow">{product.categoryCue}</p>
                      <h3 className="mt-1 font-display text-base leading-snug">{product.name}</h3>
                      <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                        {variant.label} · {formatMoney(variant.price)}
                      </p>
                      <div className="mt-auto flex items-center gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => adjust(product.id, -1)}
                          disabled={count === 0}
                          aria-label={`Remove one ${product.name}`}
                          className="flex size-8 items-center justify-center border border-border transition-colors hover:bg-premium disabled:opacity-40"
                        >
                          <Minus className="size-3.5" aria-hidden />
                        </button>
                        <span className="min-w-6 text-center text-[0.875rem] tabular-nums">
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjust(product.id, 1)}
                          disabled={remaining === 0}
                          aria-label={`Add one ${product.name}`}
                          className="flex size-8 items-center justify-center border border-border transition-colors hover:bg-premium disabled:opacity-40"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section aria-label="Finish your box">
            <SectionHeading eyebrow="Step 3" title="Finish the presentation" />
            <div className="mt-6 space-y-3">
              {hamperExtras.map((extra) => {
                const selected = extras.includes(extra.id);
                return (
                  <button
                    key={extra.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleExtra(extra.id)}
                    className={cn(
                      "flex w-full items-start gap-4 border p-4 text-left transition-colors",
                      selected
                        ? "border-foreground bg-premium"
                        : "border-border hover:border-driftwood",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border",
                      )}
                    >
                      {selected ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-base">{extra.name}</span>
                        <span className="text-[0.875rem] tabular-nums">
                          + {formatMoney(inr(extra.fee))}
                        </span>
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {extra.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <fieldset>
                <legend className="text-[0.875rem] font-medium">Ribbon colour</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {ribbonColours.map((colour) => (
                    <button
                      key={colour.id}
                      type="button"
                      aria-pressed={ribbon === colour.id}
                      onClick={() => setRibbon(colour.id)}
                      className={cn(
                        "flex items-center gap-2 border px-3 py-2 text-[0.8125rem] transition-colors",
                        ribbon === colour.id
                          ? "border-foreground"
                          : "border-border hover:border-driftwood",
                      )}
                    >
                      <span
                        aria-hidden
                        className="size-4 rounded-full border border-border"
                        style={{ backgroundColor: colour.hex }}
                      />
                      {colour.name}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <Label htmlFor="hamper-message">Message card</Label>
                <Textarea
                  id="hamper-message"
                  rows={3}
                  maxLength={200}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Written by hand on an ivory card."
                  className="mt-2"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {message.length}/200 characters
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-border bg-premium p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">Your hamper</h2>
          <p className="mt-1 text-[0.8125rem] text-muted-foreground">
            {box.name} · {filled}/{box.slots} selections
          </p>
          <Separator className="my-5 bg-border" />
          {filled === 0 ? (
            <p className="text-[0.875rem] text-muted-foreground">
              Nothing chosen yet — add selections from step two.
            </p>
          ) : (
            <ul className="space-y-2 text-[0.875rem]">
              {Object.entries(selection).map(([productId, count]) => {
                const product = products.find((item) => item.id === productId);
                if (!product) return null;
                return (
                  <li key={productId} className="flex justify-between gap-4">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {count} × {product.name}
                    </span>
                    <span className="tabular-nums">
                      {formatMoney(inr((product.variants[0]?.price.amount ?? 0) * count))}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Separator className="my-5 bg-border" />
          <dl className="space-y-3 text-[0.875rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Packaging</dt>
              <dd className="tabular-nums">{formatMoney(inr(box.fee))}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Extras</dt>
              <dd className="tabular-nums">
                {extrasTotal === 0 ? "None" : formatMoney(inr(extrasTotal))}
              </dd>
            </div>
          </dl>
          <Separator className="my-5 bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Illustrative hamper total</span>
            <span className="font-display text-xl tabular-nums">{formatMoney(inr(total))}</span>
          </div>
          <Button size="lg" className="mt-6 w-full" disabled>
            Ordering unavailable
          </Button>
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            This is a design preview. Packaging, extras, composition and prices are not yet verified
            by the authoritative retail quotation service. No order or payment is created.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Packaging, ribbon and extras require approval and a final quotation before ordering.
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/gifting">Gifting services</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
