import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { track } from "@/lib/analytics";
import { SUPPORT_REASONS, submitSupportRequest, type SupportReasonId } from "@/lib/support.functions";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Get help with an Oasis Baklawa order — delivery, damage, wrong item, payment or cancellation.";

type SearchParams = { reference?: string };

export const Route = createFileRoute("/support")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const reference = typeof search["reference"] === "string" ? search["reference"].slice(0, 40) : "";
    return reference ? { reference } : {};
  },
  head: () => ({
    meta: [
      { title: "Order Help & Support — Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Order Help & Support — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SupportPage,
});

type Submission =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "received"; ticket: string }
  | { kind: "fallback"; reason: string };

function SupportPage() {
  const { reference = "" } = Route.useSearch();
  const send = useServerFn(submitSupportRequest);

  const [reason, setReason] = useState<SupportReasonId>("delivery");
  const [form, setForm] = useState({ name: "", contact: "", orderReference: reference, message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<Submission>({ kind: "idle" });
  const key = useRef(
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `sup-${Date.now()}`,
  );

  function validate() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next["name"] = "Tell us your name.";
    if (form.contact.trim().length < 5) next["contact"] = "Add an email address or phone number so we can reply.";
    if (form.message.trim().length < 10) next["message"] = "Please describe what happened.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (state.kind === "sending" || !validate()) return;
    setState({ kind: "sending" });
    try {
      const result = await send({
        data: {
          reason,
          name: form.name.trim(),
          contact: form.contact.trim(),
          message: form.message.trim(),
          ...(form.orderReference.trim() ? { orderReference: form.orderReference.trim() } : {}),
          idempotencyKey: key.current,
        },
      });
      track({ name: "generate_lead", params: { lead_type: `support:${reason}` } });
      if (result.status === "received") setState({ kind: "received", ticket: result.ticketReference });
      else setState({ kind: "fallback", reason: result.reason });
    } catch {
      setState({
        kind: "fallback",
        reason: "We couldn’t send that just now. Please use the contact details below and we will help you straight away.",
      });
    }
  }

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Help" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Help"
          title="Help with an order"
          intro="Tell us what happened and we will take it from there. If your question is about delivery timing, the tracking page usually has the fastest answer."
          action={
            <Button asChild variant="outline">
              <Link to="/track-order">Track an order</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <form onSubmit={onSubmit} className="border border-border bg-utility p-6 md:p-8" noValidate>
          <fieldset>
            <legend className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
              What is this about?
            </legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUPPORT_REASONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={reason === option.id}
                  onClick={() => setReason(option.id)}
                  className={cn(
                    "min-h-11 border px-4 py-2 text-[0.875rem] transition-colors",
                    reason === option.id
                      ? "border-foreground bg-premium"
                      : "border-border hover:border-driftwood",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="s-name">Your name</Label>
              <Input
                id="s-name"
                className="mt-2 h-11"
                value={form.name}
                autoComplete="name"
                aria-invalid={Boolean(errors["name"])}
                aria-describedby={errors["name"] ? "s-name-error" : undefined}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
              />
              {errors["name"] ? (
                <p id="s-name-error" role="alert" className="mt-1 text-[0.8125rem] text-truffle">
                  {errors["name"]}
                </p>
              ) : null}
            </div>
            <div>
              <Label htmlFor="s-contact">Email or phone</Label>
              <Input
                id="s-contact"
                className="mt-2 h-11"
                value={form.contact}
                autoComplete="email"
                aria-invalid={Boolean(errors["contact"])}
                aria-describedby={errors["contact"] ? "s-contact-error" : undefined}
                onChange={(event) => setForm((f) => ({ ...f, contact: event.target.value }))}
              />
              {errors["contact"] ? (
                <p id="s-contact-error" role="alert" className="mt-1 text-[0.8125rem] text-truffle">
                  {errors["contact"]}
                </p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="s-ref">Order reference (optional)</Label>
              <Input
                id="s-ref"
                className="mt-2 h-11"
                value={form.orderReference}
                onChange={(event) => setForm((f) => ({ ...f, orderReference: event.target.value.toUpperCase() }))}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="s-message">What happened?</Label>
              <Textarea
                id="s-message"
                rows={5}
                className="mt-2"
                value={form.message}
                maxLength={1500}
                aria-invalid={Boolean(errors["message"])}
                aria-describedby={errors["message"] ? "s-message-error" : undefined}
                onChange={(event) => setForm((f) => ({ ...f, message: event.target.value }))}
              />
              {errors["message"] ? (
                <p id="s-message-error" role="alert" className="mt-1 text-[0.8125rem] text-truffle">
                  {errors["message"]}
                </p>
              ) : null}
            </div>
          </div>

          <Button type="submit" className="mt-6 h-11" disabled={state.kind === "sending"}>
            {state.kind === "sending" ? "Sending…" : "Send to our team"}
          </Button>

          <div aria-live="polite" className="mt-5">
            {state.kind === "received" ? (
              <p className="border border-border bg-premium p-4 text-[0.875rem]">
                Thank you — your request is logged as{" "}
                <span className="font-medium tabular-nums">{state.ticket}</span>. We reply within one
                working day.
              </p>
            ) : null}
            {state.kind === "fallback" ? (
              <p role="alert" className="border border-border bg-premium p-4 text-[0.875rem]">
                {state.reason}{" "}
                <Link to="/contact" className="underline decoration-gold/70 underline-offset-4">
                  See our contact details
                </Link>
                .
              </p>
            ) : null}
          </div>
        </form>

        <aside className="space-y-6">
          <div className="border border-border p-6">
            <h2 className="font-display text-lg">Cancellations & refunds</h2>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
              Because everything is prepared fresh to order, a cancellation can only be actioned before
              your order is packed. Send a cancellation request here and our team will confirm what is
              possible.
            </p>
            <Button variant="ghost" className="mt-3 px-0" asChild>
              <Link to="/returns">Returns & refunds policy</Link>
            </Button>
          </div>
          <div className="border border-border p-6">
            <h2 className="font-display text-lg">Common questions</h2>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
              Delivery windows, storage, shelf life and gifting options are answered on our FAQ.
            </p>
            <Button variant="ghost" className="mt-3 px-0" asChild>
              <Link to="/faq">Read the FAQ</Link>
            </Button>
          </div>
        </aside>
      </section>
    </div>
  );
}
