import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Check, Lock } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { INDIAN_STATES, isValidGstin, loadAddresses, rememberOrderRef } from "@/lib/account";
import { placeOrder, priceCart } from "@/lib/commerce.functions";
import { paymentStatus } from "@/lib/payments.functions";
import { cartSubtotal, resolveLines, useShop } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Choose delivery speed, personalise your gift and complete your Oasis Baklawa order securely.",
      },
      { property: "og:title", content: "Checkout — Oasis Baklawa" },
      { property: "og:description", content: "Delivery, personalisation and payment." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type SubmitState =
  | { kind: "idle" }
  | { kind: "pricing" }
  | { kind: "submitting" }
  | { kind: "price-changed"; newTotal: number }
  | { kind: "error"; message: string };

type FieldErrors = Record<string, string>;

const FORM_ID = "checkout-form";

function CheckoutPage() {
  const { lines, gift, clearCart: clear } = useShop();
  const navigate = useNavigate();
  const resolved = resolveLines(lines);
  const subtotal = cartSubtotal(resolved);
  const submitOrder = useServerFn(placeOrder);
  const repriceCart = useServerFn(priceCart);
  const readPaymentStatus = useServerFn(paymentStatus);

  const [deliveryId, setDeliveryId] = useState(deliveryOptions[0]!.id);
  const [extras, setExtras] = useState<string[]>([]);
  const [ribbon, setRibbon] = useState(gift.ribbonId || ribbonColours[0]!.id);
  const [region, setRegion] = useState<PaymentRegion>("india");
  const [methodId, setMethodId] = useState(paymentMethods[0]!.id);
  const [paymentLive, setPaymentLive] = useState<boolean | null>(null);

  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [isGift, setIsGift] = useState(Boolean(gift.message));
  const [recipient, setRecipient] = useState({ name: "", phone: "" });
  const [giftMessage, setGiftMessage] = useState(gift.message ?? "");
  const [concealInvoice, setConcealInvoice] = useState(gift.concealInvoice ?? false);
  const [notes, setNotes] = useState("");
  const [wantsInvoice, setWantsInvoice] = useState(false);
  const [business, setBusiness] = useState({ legalName: "", gstin: "", placeOfSupply: "" });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submit, setSubmit] = useState<SubmitState>({ kind: "idle" });
  // Stable per-attempt key: a retried submit can never create a second order.
  const idempotencyKey = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `co-${Date.now()}`,
  );
  const inFlight = useRef(false);

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

  // Prefill from an address saved on this device, and report checkout start.
  useEffect(() => {
    const saved = loadAddresses().find((entry) => entry.isDefault) ?? loadAddresses()[0];
    if (saved) {
      setContact((current) =>
        current.name || current.email
          ? current
          : { name: saved.name, phone: saved.phone, email: saved.email ?? "" },
      );
      setAddress({
        line1: saved.line1,
        line2: saved.line2 ?? "",
        city: saved.city,
        state: saved.state,
        pincode: saved.pincode,
      });
    }
    void readPaymentStatus()
      .then((status) => setPaymentLive(status.live))
      .catch(() => setPaymentLive(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resolved.length === 0) return;
    track({
      name: "begin_checkout",
      params: {
        currency: subtotal.currency,
        value: subtotal.amount,
        items: resolved.map((line) => ({
          item_id: line.variant.id,
          item_name: line.product.name,
          price: line.variant.price.amount,
          quantity: line.line.quantity,
        })),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved.length]);

  function validate(): boolean {
    const next: FieldErrors = {};
    if (contact.name.trim().length < 2) next["name"] = "Enter the full name for the order.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(contact.email.trim()))
      next["email"] = "Enter a valid email address — your confirmation goes here.";
    if (!/^[6-9]\d{9}$/.test(contact.phone.replace(/\D/g, "")))
      next["phone"] = "Enter a 10-digit Indian mobile number.";
    if (address.line1.trim().length < 5) next["line1"] = "Enter the flat, building and street.";
    if (address.city.trim().length < 2) next["city"] = "Enter the city.";
    if (address.state.trim().length < 2) next["state"] = "Select the state.";
    if (!/^[1-9]\d{5}$/.test(address.pincode.replace(/\D/g, "")))
      next["pincode"] = "Enter a valid 6-digit PIN code.";
    if (isGift && recipient.name.trim().length < 2)
      next["recipientName"] = "Enter the name of the person receiving the gift.";
    if (wantsInvoice && business.legalName.trim().length < 2)
      next["legalName"] = "Enter the registered business name.";
    if (wantsInvoice && business.gstin.trim() && !isValidGstin(business.gstin))
      next["gstin"] = "That doesn’t look like a 15-character GSTIN.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      const firstKey = Object.keys(next)[0]!;
      document.getElementById(`co-${firstKey}`)?.focus();
      return false;
    }
    return true;
  }

  const toggleExtra = (id: string) =>
    setExtras((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (inFlight.current) return;
    if (!validate()) return;

    inFlight.current = true;
    setSubmit({ kind: "pricing" });

    const cartLines = lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      quantity: line.quantity,
    }));

    try {
      // The server prices the cart immediately before the order is created:
      // the browser total is only ever a display of the approved snapshot.
      const priced = await repriceCart({
        data: { lines: cartLines, deliveryOptionId: deliveryId },
      });

      if (priced.lines.length !== cartLines.length) {
        setSubmit({
          kind: "error",
          message:
            "One of the items in your bag is no longer available. Please review your bag and try again.",
        });
        inFlight.current = false;
        return;
      }

      if (
        submit.kind !== "price-changed" &&
        Math.abs(priced.subtotal.amount - subtotal.amount) > 0.5
      ) {
        setSubmit({ kind: "price-changed", newTotal: priced.subtotal.amount });
        inFlight.current = false;
        return;
      }

      track({
        name: "add_shipping_info",
        params: { currency: subtotal.currency, value: total, shipping_tier: delivery.name },
      });
      track({
        name: "add_payment_info",
        params: { currency: subtotal.currency, value: total, payment_type: methodId },
      });

      setSubmit({ kind: "submitting" });

      const result = await submitOrder({
        data: {
          lines: cartLines,
          contact: {
            name: contact.name.trim(),
            email: contact.email.trim(),
            phone: contact.phone.replace(/\D/g, ""),
          },
          shipping: {
            addressLine1: address.line1.trim(),
            ...(address.line2.trim() ? { addressLine2: address.line2.trim() } : {}),
            city: address.city.trim(),
            state: address.state.trim(),
            pincode: address.pincode.replace(/\D/g, ""),
            country: "IN",
          },
          deliveryOptionId: deliveryId,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
          ...(wantsInvoice
            ? {
                business: {
                  legalName: business.legalName.trim(),
                  ...(business.gstin.trim() ? { gstin: business.gstin.trim().toUpperCase() } : {}),
                  ...(business.placeOfSupply.trim()
                    ? { placeOfSupply: business.placeOfSupply.trim() }
                    : {}),
                },
              }
            : {}),
          ...(isGift
            ? {
                gift: {
                  ...(giftMessage.trim() ? { message: giftMessage.trim() } : {}),
                  ribbonId: ribbon,
                  concealInvoice,
                },
              }
            : {}),
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
              quantity: line.line.quantity,
            })),
          },
        });
        rememberOrderRef(result.orderReference, contact.email.trim());
        clear();
        void navigate({ to: "/order/$reference", params: { reference: result.orderReference } });
        return;
      }

      setSubmit({ kind: "error", message: result.reason });
    } catch {
      setSubmit({
        kind: "error",
        message: "We couldn’t reach the order service. Please try again.",
      });
    } finally {
      inFlight.current = false;
    }
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

  const busy = submit.kind === "pricing" || submit.kind === "submitting";

  const field = (key: string) => ({
    "aria-invalid": Boolean(errors[key]),
    "aria-describedby": errors[key] ? `co-${key}-error` : undefined,
  });

  const fieldError = (key: string) =>
    errors[key] ? (
      <p id={`co-${key}-error`} role="alert" className="mt-1 text-[0.8125rem] text-truffle">
        {errors[key]}
      </p>
    ) : null;

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs
        items={[{ label: "Home", to: "/" }, { label: "Bag", to: "/cart" }, { label: "Checkout" }]}
      />
      <h1 className="mt-6 text-3xl md:text-[2.5rem]">Checkout</h1>
      <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
        No account needed — order as a guest. Your total is confirmed by our order system before
        anything is collected.
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <form id={FORM_ID} onSubmit={handleSubmit} noValidate className="space-y-12">
          <section aria-labelledby="delivery-heading">
            <h2 id="delivery-heading" className="font-display text-xl">
              1. Delivery speed
            </h2>
            <p className="mt-2 text-[0.875rem] text-muted-foreground">
              Faster windows carry a surcharge, shown before you pay. Availability for your PIN code
              is confirmed when your order is accepted.
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
                      selected
                        ? "border-foreground bg-premium"
                        : "border-border hover:border-driftwood",
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

            <label className="mt-6 flex items-start gap-3 text-[0.9375rem]">
              <Checkbox
                checked={isGift}
                onCheckedChange={(checked) => setIsGift(checked === true)}
              />
              This order is a gift for someone else
            </label>

            {isGift ? (
              <div className="mt-5 grid gap-6 sm:grid-cols-2">
                <div>
                  <Label htmlFor="co-recipientName">Recipient’s name</Label>
                  <Input
                    id="co-recipientName"
                    className="mt-2 h-11"
                    value={recipient.name}
                    {...field("recipientName")}
                    onChange={(event) => setRecipient((r) => ({ ...r, name: event.target.value }))}
                  />
                  {fieldError("recipientName")}
                </div>
                <div>
                  <Label htmlFor="co-recipientPhone">Recipient’s phone (optional)</Label>
                  <Input
                    id="co-recipientPhone"
                    className="mt-2 h-11"
                    inputMode="tel"
                    value={recipient.phone}
                    onChange={(event) => setRecipient((r) => ({ ...r, phone: event.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="gift-message">Gift message</Label>
                  <Textarea
                    id="gift-message"
                    rows={3}
                    maxLength={250}
                    className="mt-2"
                    value={giftMessage}
                    onChange={(event) => setGiftMessage(event.target.value)}
                  />
                  <p className="mt-1 text-[0.75rem] text-muted-foreground">
                    {giftMessage.length}/250 characters, written by hand on the card.
                  </p>
                </div>
                <label className="flex items-start gap-3 text-[0.9375rem] sm:col-span-2">
                  <Checkbox
                    checked={concealInvoice}
                    onCheckedChange={(checked) => setConcealInvoice(checked === true)}
                  />
                  Hide all prices and the invoice inside the parcel
                </label>
                <fieldset className="sm:col-span-2">
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
                          "flex min-h-11 items-center gap-2 border px-3 py-2 text-[0.8125rem] transition-colors",
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
              </div>
            ) : null}
          </section>

          <section aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="font-display text-xl">
              3. Payment
            </h2>
            <div
              className="mt-4 inline-flex border border-border"
              role="tablist"
              aria-label="Payment region"
            >
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
                    "min-h-11 px-4 py-2 text-[0.8125rem] uppercase tracking-[0.12em] transition-colors",
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
                      selected
                        ? "border-foreground bg-premium"
                        : "border-border hover:border-driftwood",
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

            {paymentLive === false ? (
              <p className="mt-5 border border-border bg-utility p-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                Card and UPI payment is temporarily unavailable online. You can still complete this
                form — our team will confirm your order and arrange payment with you directly.
              </p>
            ) : null}

            {region === "international" ? (
              <div className="mt-5 border border-border bg-utility p-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                Prices may be displayed in{" "}
                {supportedCurrencies.map((currency) => currency.code).join(", ")}, and every order
                is settled in Indian Rupees. Any customs duty is payable by the recipient.
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
                  className="mt-2 h-11"
                  value={contact.name}
                  {...field("name")}
                  onChange={(event) => setContact((c) => ({ ...c, name: event.target.value }))}
                />
                {fieldError("name")}
              </div>
              <div>
                <Label htmlFor="co-phone">Phone</Label>
                <Input
                  id="co-phone"
                  type="tel"
                  autoComplete="tel"
                  className="mt-2 h-11"
                  value={contact.phone}
                  {...field("phone")}
                  onChange={(event) => setContact((c) => ({ ...c, phone: event.target.value }))}
                />
                {fieldError("phone")}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-email">Email</Label>
                <Input
                  id="co-email"
                  type="email"
                  autoComplete="email"
                  className="mt-2 h-11"
                  value={contact.email}
                  {...field("email")}
                  onChange={(event) => setContact((c) => ({ ...c, email: event.target.value }))}
                />
                {fieldError("email")}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-line1">Flat, building and street</Label>
                <Input
                  id="co-line1"
                  autoComplete="address-line1"
                  className="mt-2 h-11"
                  value={address.line1}
                  {...field("line1")}
                  onChange={(event) => setAddress((a) => ({ ...a, line1: event.target.value }))}
                />
                {fieldError("line1")}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-line2">Area or landmark (optional)</Label>
                <Input
                  id="co-line2"
                  autoComplete="address-line2"
                  className="mt-2 h-11"
                  value={address.line2}
                  onChange={(event) => setAddress((a) => ({ ...a, line2: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="co-city">City</Label>
                <Input
                  id="co-city"
                  autoComplete="address-level2"
                  className="mt-2 h-11"
                  value={address.city}
                  {...field("city")}
                  onChange={(event) => setAddress((a) => ({ ...a, city: event.target.value }))}
                />
                {fieldError("city")}
              </div>
              <div>
                <Label htmlFor="co-state">State</Label>
                <select
                  id="co-state"
                  className="mt-2 h-11 w-full border border-input bg-transparent px-3 text-[0.9375rem]"
                  value={address.state}
                  {...field("state")}
                  onChange={(event) => setAddress((a) => ({ ...a, state: event.target.value }))}
                >
                  <option value="">Select a state</option>
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {fieldError("state")}
              </div>
              <div>
                <Label htmlFor="co-pincode">PIN code</Label>
                <Input
                  id="co-pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  className="mt-2 h-11"
                  value={address.pincode}
                  {...field("pincode")}
                  onChange={(event) => setAddress((a) => ({ ...a, pincode: event.target.value }))}
                />
                {fieldError("pincode")}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="co-notes">Delivery notes (optional)</Label>
                <Textarea
                  id="co-notes"
                  rows={2}
                  maxLength={500}
                  className="mt-2"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>

            <label className="mt-6 flex items-start gap-3 text-[0.9375rem]">
              <Checkbox
                checked={wantsInvoice}
                onCheckedChange={(checked) => setWantsInvoice(checked === true)}
              />
              I need a business invoice (GST)
            </label>

            {wantsInvoice ? (
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="co-legalName">Registered business name</Label>
                  <Input
                    id="co-legalName"
                    className="mt-2 h-11"
                    value={business.legalName}
                    {...field("legalName")}
                    onChange={(event) =>
                      setBusiness((b) => ({ ...b, legalName: event.target.value }))
                    }
                  />
                  {fieldError("legalName")}
                </div>
                <div>
                  <Label htmlFor="co-gstin">GSTIN (optional)</Label>
                  <Input
                    id="co-gstin"
                    className="mt-2 h-11"
                    value={business.gstin}
                    {...field("gstin")}
                    onChange={(event) =>
                      setBusiness((b) => ({ ...b, gstin: event.target.value.toUpperCase() }))
                    }
                  />
                  {fieldError("gstin")}
                </div>
                <div>
                  <Label htmlFor="co-placeOfSupply">Place of supply (optional)</Label>
                  <Input
                    id="co-placeOfSupply"
                    className="mt-2 h-11"
                    value={business.placeOfSupply}
                    onChange={(event) =>
                      setBusiness((b) => ({ ...b, placeOfSupply: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : null}
          </section>
        </form>

        <aside className="h-fit border border-border bg-premium p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl">Order summary</h2>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Preview estimates only. Product prices, delivery and personalisation totals are not
            authoritative until verified by Oasis Core retail checkout.
          </p>
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
              <dd className="text-muted-foreground">Included where applicable</dd>
            </div>
          </dl>
          <Separator className="my-5 bg-border" />
          <div className="flex items-baseline justify-between">
            <span className="eyebrow">Payable now</span>
            <span className="font-display text-xl tabular-nums">{formatMoney(inr(total))}</span>
          </div>
          <Button size="lg" className="mt-6 w-full" type="submit" form={FORM_ID} disabled={busy}>
            <Lock className="size-4" aria-hidden />
            {submit.kind === "pricing"
              ? "Confirming your total…"
              : submit.kind === "submitting"
                ? "Placing your order…"
                : submit.kind === "price-changed"
                  ? "Confirm and place order"
                  : "Place order"}
          </Button>

          <div aria-live="polite">
            {submit.kind === "price-changed" ? (
              <p role="alert" className="mt-3 text-xs leading-relaxed text-foreground">
                The price of your bag has been updated to {formatMoney(inr(submit.newTotal))} before
                delivery. Press the button again to confirm at the new price.
              </p>
            ) : null}
            {submit.kind === "error" ? (
              <p role="alert" className="mt-3 text-xs leading-relaxed text-destructive">
                {submit.message}{" "}
                <Link to="/support" className="link-underline">
                  Get help
                </Link>
              </p>
            ) : null}
          </div>

          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Your total is confirmed by our order system before any amount is collected. See{" "}
            <Link to="/payment-options" className="link-underline">
              payment options
            </Link>{" "}
            and our{" "}
            <Link to="/returns" className="link-underline">
              returns policy
            </Link>
            .
          </p>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/cart">Back to bag</Link>
          </Button>
        </aside>
      </div>
    </div>
  );
}
