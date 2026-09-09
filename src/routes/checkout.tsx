import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Lock } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  deliveryOptions,
  inr,
  paymentMethods,
  personalisationOptions,
  ribbonColours,
  supportedCurrencies,
  type PaymentRegion,
} from "@/data/checkout";
import { formatMoney } from "@/lib/format";
import { track } from "@/lib/analytics";
import { placeOrder } from "@/lib/commerce.functions";
import { cartSubtotal, resolveLines, useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Choose delivery speed, personalise your gift and select an Indian or international payment method.",
      },
      { property: "og:title", content: "Checkout — Oasis Baklawa" },
      { property: "og:description", content: "Delivery, personalisation and payment options." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "created"; reference: string }
  | { kind: "error"; message: string };

function CheckoutPage() {
  const { lines, clearCart: clear } = useShop();
  const resolved = resolveLines(lines);
  const subtotal = cartSubtotal(resolved);
  const submitOrder = useServerFn(placeOrder);

  const [deliveryId, setDeliveryId] = useState(deliveryOptions[0]!.id);
  const [extras, setExtras] = useState<string[]>([]);
  const [ribbon, setRibbon] = useState(ribbonColours[0]!.id);
  const [region, setRegion] = useState<PaymentRegion>("india");
  const [methodId, setMethodId] = useState(paymentMethods[0]!.id);

  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [address, setAddress] = useState({ line1: "", city: "", pincode: "" });
  const [giftMessage, setGiftMessage] = useState("");
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  // Stable per-attempt key: a retried submit can never create a second order.
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `co-${Date.now()}`,
  );

  const delivery = deliveryOptions.find((option) => option.id === deliveryId)!;
  const deliveryFee =
    delivery.freeAbove && subtotal.amount >= delivery.freeAbove ? 0 : delivery.fee;

  const extrasFee = useMemo(
    () =>
      personalisationOptions
        .filter((option) => extras.includes(option.id))
        .reduce((sum, option) => sum + option.fee, 0),
    [extras],
  );

  const total = subtotal.amount + deliveryFee + extrasFee;
  const methods = paymentMethods.filter((method) => method.region === region);

  const detailsComplete =
    contact.name.trim().length > 1 &&
    /.+@.+\..+/.test(contact.email) &&
    /^[6-9]\d{9}$/.test(contact.phone.replace(/\D/g, "")) &&
    address.line1.trim().length > 4 &&
    address.city.trim().length > 1 &&
    /^[1-9]\d{5}$/.test(address.pincode.replace(/\D/g, ""));

  const toggleExtra = (id: string) =>
    setExtras((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  async function handlePlaceOrder() {
    if (submit.kind === "submitting" || !detailsComplete) return;
    setSubmit({ kind: "submitting" });
    try {
      const result = await submitOrder({
        data: {
          lines: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          contact: {
            name: contact.name.trim(),
            email: contact.email.trim(),
            phone: contact.phone.replace(/\D/g, ""),
          },
          shipping: {
            addressLine1: address.line1.trim(),
            city: address.city.trim(),
            pincode: address.pincode.replace(/\D/g, ""),
            country: "IN",
          },
          deliveryOptionId: deliveryId,
          ...(giftMessage.trim() ? { gift: { message: giftMessage.trim(), ribbonId: ribbon } } : {}),
          idempotencyKey: idempotencyKey.current,
        },
      });

      if (result.status === "created") {
        track({
          name: "purchase",
          params: {
            transaction_id: result.orderReference,
            value: result.total.amount,
            currency: result.total.currency,
            items: resolved.map((line) => ({
              item_id: line.variant.id,
              item_name: line.product.name,
              price: line.variant.price.amount,
              quantity: line.quantity,
            })),
          },
        });
        clear();
        setSubmit({ kind: "created", reference: result.orderReference });
      } else {
        setSubmit({ kind: "error", message: result.reason });
      }
    } catch {
      setSubmit({ kind: "error", message: "We couldn’t reach the order service. Please try again." });
    }
  }

  if (submit.kind === "created") {
    return (
      <div className="container-oasis py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Order placed" }]} />
        <div className="mx-auto mt-12 max-w-xl border border-border bg-premium p-8 text-center">
          <p className="eyebrow">Order received</p>
          <h1 className="mt-4 font-display text-3xl">Thank you — your order is with us</h1>
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Your reference is{" "}
            <span className="font-medium text-foreground tabular-nums">{submit.reference}</span>. Keep
            it handy to follow your parcel.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to="/track-order">Track this order</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shop">Continue shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (resolved.length === 0) {
    return (
      <div className="container-oasis py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Checkout" }]} />
        <h1 className="mt-6 text-3xl md:text-[2.5rem]">Checkout</h1>
        <div className="mt-10">
          <EmptyState
            title="Your bag is empty"
            description="Add a tray, box or hamper before moving to checkout."
            action={
              <Button asChild>
                <Link to="/shop">Browse the range</Link>
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bag", to: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mt-6 text-3xl md:text-[2.5rem]">Checkout</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
        This is a design build: no payment gateway is connected yet, so nothing is charged. Every
        option below reflects how the live checkout will be structured.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <div className="space-y-12">
          <section aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="font-display text-xl">
              1. Delivery speed
            </h2>
            <p className="mt-2 text-[0.875rem] text-muted-foreground">
              Faster windows carry a surcharge, shown before you pay.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {deliveryOptions.map((option) => {
                const selected = option.id === deliveryId;
                const free = option.freeAbove && subtotal.amount >= option.freeAbove;
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setDeliveryId(option.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 border p-4 text-left transition-colors",
                      selected ? "border-foreground bg-premium" : "border-border hover:border-driftwood",
                    )}
                  >
                    <span className="flex w-full items-baseline justify-between gap-3">
                      <span className="font-display text-base">{option.name}</span>
                      <span className="text-[0.875rem] tabular-nums">
                        {free ? "Free" : formatMoney(inr(option.fee))}
                      </span>
                    </span>
                    <span className="text-[0.8125rem] text-muted-foreground">{option.window}</span>
                    <span className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {option.note}
                    </span>
                    {option.badge ? <span className="eyebrow mt-1">{option.badge}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="personalise-heading">
            <h2 id="personalise-heading" className="font-display text-xl">
              2. Personalisation
            </h2>
            <div className="mt-5 space-y-3">
              {personalisationOptions.map((option) => {
                const selected = extras.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleExtra(option.id)}
                    className={cn(
                      "flex w-full items-start gap-4 border p-4 text-left transition-colors",
                      selected ? "border-foreground bg-premium" : "border-border hover:border-driftwood",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center border",
                        selected ? "border-foreground bg-foreground text-background" : "border-border",
                      )}
                    >
                      {selected ? <Check className="size-3.5" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-base">{option.name}</span>
                        <span className="text-[0.875rem] tabular-nums">
                          {option.fee === 0 ? "Included" : `+ ${formatMoney(inr(option.fee))}`}
                        </span>
                      </span>
                      <span className="mt-1 block text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <Label htmlFor="gift-message">Gift message</Label>
                <Textarea
                  id="gift-message"
                  rows={3}
                  maxLength={250}
                  placeholder="Up to 250 characters, written by hand on the card."
                  className="mt-2"
                  value={giftMessage}
                  onChange={(e) => setGiftMessage(e.target.value)}
                />
              </div>
              <fieldset>
                <legend className="text-[0.875rem] font-medium">Ribbon colour</legend>
                <div className="mt-3 flex flex-wrap gap-3">
                  {ribbonColours.map((colour) => (
                    <button
                      key={colour.id}
                      type="button"
                      aria-pressed={ribbon === colour.id}
                      aria-label={colour.name}
                      onClick={() => setRibbon(colour.id)}
                      className={cn(
                        "flex items-center gap-2 border px-3 py-2 text-[0.8125rem] transition-colors",
                        ribbon === colour.id ? "border-foreground" : "border-border hover:border-driftwood",
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
            </div>
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-display text-xl">
              3. Payment
            </h2>
            <div className="mt-4 inline-flex border border-border" role="tablist" aria-label="Payment region">
              {(["india", "international"] as const).map((value) => (
                <button
                  key={value}
                  role="tab"
                  type="button"
                  aria-selected={region === value}
                  onClick={() => {
                    setRegion(value);
                    const first = paymentMethods.find((method) => method.region === value);
                    if (first) setMethodId(first.id);
                  }}
                  className={cn(
                    "px-4 py-2 text-[0.8125rem] uppercase tracking-[0.12em] transition-colors",
                    region === value ? "bg-foreground text-background" : "hover:bg-premium",
                  )}
                >
                  {value === "india" ? "India" : "International"}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {methods.map((method) => {
                const selected = methodId === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setMethodId(method.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-1 border p-4 text-left transition-colors",
                      selected ? "border-foreground bg-premium" : "border-border hover:border-driftwood",
                    )}
                  >
                    <span className="flex w-full flex-wrap items-baseline justify-between gap-2">
                      <span className="font-display text-base">{method.name}</span>
                      {method.instant ? <span className="eyebrow">One-tap</span> : null}
                    </span>
                    <span className="text-[0.8125rem] leading-relaxed text-muted-foreground">
                      {method.detail}
                    </span>
                    <span className="mt-2 flex flex-wrap gap-2">
                      {method.brands.map((brand) => (
                        <span
                          key={brand}
                          className="border border-border px-2 py-1 text-[0.6875rem] uppercase tracking-[0.1em] text-driftwood"
                        >
                          {brand}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>

            {region === "international" ? (
              <div className="mt-5 border border-border bg-utility p-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                Prices are shown in{" "}
                {supportedCurrencies.map((currency) => currency.code).join(", ")} and settled by the
                gateway at the rate applied on the day of payment. Export duties, where applicable,
                are payable by the recipient.
              </div>
            ) : null}
          </section>

          <section aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="font-display text-xl">
              4. Contact & delivery address
            </h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="co-name">Full name</Label>
                <Input
                  id="co-name"
                  autoComplete="name"
                  className="mt-2"
                  value={contact.name}
                  onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="co-phone">Phone</Label>
                <Input
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-2"
                  value={contact.phone}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-email">Email</Label>
                <Input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  className="mt-2"
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-address">Address</Label>
                <Textarea
                  id="co-address"
                  rows={3}
                  autoComplete="street-address"
                  className="mt-2"
                  value={address.line1}
                  onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="co-city">City</Label>
                <Input
                  id="co-city"
                  autoComplete="address-level2"
                  className="mt-2"
                  value={address.city}
                  onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="co-pin">PIN / ZIP code</Label>
                <Input
                  id="co-pin"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className="mt-2"
                  value={address.pincode}
                  onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))}
                />
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit border border-border bg-premium p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">Order summary</h2>
          <Separator className="my-5 bg-border" />
          <dl className="space-y-3 text-[0.875rem]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Subtotal ({resolved.length} items)</dt>
              <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{delivery.name}</dt>
              <dd className="tabular-nums">
                {deliveryFee === 0 ? "Free" : formatMoney(inr(deliveryFee))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Personalisation</dt>
              <dd className="tabular-nums">
                {extrasFee === 0 ? "Included" : formatMoney(inr(extrasFee))}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Taxes</dt>
              <dd className="text-muted-foreground">Calculated by the gateway</dd>
            </div>
          </dl>
          <Separator className="my-5 bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Payable now</span>
            <span className="font-display text-xl tabular-nums">{formatMoney(inr(total))}</span>
          </div>
          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={!detailsComplete || submit.kind === "submitting"}
            onClick={handlePlaceOrder}
          >
            <Lock className="size-4" aria-hidden />
            {submit.kind === "submitting" ? "Placing your order…" : "Place order"}
          </Button>
          {submit.kind === "error" ? (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-destructive">
              {submit.message}
            </p>
          ) : null}
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {detailsComplete
              ? "Your order is confirmed with our team before any amount is collected."
              : "Fill in your name, email, phone and delivery address to continue."}{" "}
            See{" "}
            <Link to="/payment-options" className="link-underline">
              payment options
            </Link>{" "}
            for what will be accepted.
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/cart">Back to bag</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
