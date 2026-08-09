import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import {
  paymentAssurances,
  paymentMethods,
  paymentProviders,
  supportedCurrencies,
} from "@/data/checkout";

export const Route = createFileRoute("/payment-options")({
  head: () => ({
    meta: [
      { title: "Payment Options — Indian & International | Oasis Baklawa" },
      {
        name: "description",
        content:
          "UPI, cards, net banking, wallets, EMI and cash on delivery in India, plus international cards, Apple Pay, Google Pay, PayPal and bank transfer.",
      },
      { property: "og:title", content: "Payment Options — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Indian and international payment methods accepted at Oasis Baklawa checkout.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentOptionsPage,
});

function PaymentOptionsPage() {
  const india = paymentMethods.filter((method) => method.region === "india");
  const intl = paymentMethods.filter((method) => method.region === "international");

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Payment options" }]} />

      <header className="mt-6 max-w-3xl">
        <p className="eyebrow">Payments</p>
        <h1 className="mt-3 text-3xl md:text-[2.75rem]">Ways to pay, in India and abroad</h1>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          Checkout is being prepared for both domestic and cross-border orders. No gateway is live
          in this build, so nothing on this page can be charged yet.
        </p>
      </header>

      <section className="mt-14" aria-labelledby="india-heading">
        <SectionHeading eyebrow="Within India" title="Domestic methods" />
        <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {india.map((method) => (
            <li key={method.id} className="bg-canvas p-6">
              <h3 className="font-display text-lg">{method.name}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {method.detail}
              </p>
              <p className="mt-4 flex flex-wrap gap-2">
                {method.brands.map((brand) => (
                  <span
                    key={brand}
                    className="border border-border px-2 py-1 text-[0.6875rem] uppercase tracking-[0.1em] text-driftwood"
                  >
                    {brand}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="intl-heading">
        <SectionHeading
         
          eyebrow="Outside India"
          title="International methods"
          description="Cross-border orders are quoted in your currency and settled by the gateway."
        />
        <ul className="mt-8 grid gap-px border border-border bg-border sm:grid-cols-2">
          {intl.map((method) => (
            <li key={method.id} className="bg-canvas p-6">
              <h3 className="font-display text-lg">{method.name}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {method.detail}
              </p>
              <p className="mt-4 flex flex-wrap gap-2">
                {method.brands.map((brand) => (
                  <span
                    key={brand}
                    className="border border-border px-2 py-1 text-[0.6875rem] uppercase tracking-[0.1em] text-driftwood"
                  >
                    {brand}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="currency-heading">
        <SectionHeading eyebrow="Currencies" title="Pricing display" />
        <dl className="mt-8 grid gap-8 sm:grid-cols-3">
          {supportedCurrencies.map((currency) => (
            <div key={currency.code} className="border-t border-border pt-5">
              <dt className="font-display text-lg">
                {currency.code} — {currency.label}
              </dt>
              <dd className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {currency.note}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-16" aria-labelledby="routing-heading">
        <SectionHeading
         
          eyebrow="Gateway routing"
          title="How payments will be processed"
          description="Planned routing. Provider names and terms are confirmed at connection time."
        />
        <ul className="mt-8 grid gap-px border border-border bg-border md:grid-cols-3">
          {paymentProviders.map((provider) => (
            <li key={provider.id} className="bg-premium p-6">
              <p className="eyebrow">{provider.scope}</p>
              <h3 className="mt-2 font-display text-lg">{provider.name}</h3>
              <ul className="mt-4 space-y-1 text-[0.875rem] text-muted-foreground">
                {provider.covers.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-4 text-[0.6875rem] uppercase tracking-[0.12em] text-driftwood">
                Not connected yet
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16" aria-labelledby="trust-heading">
        <SectionHeading eyebrow="Safeguards" title="Paying with confidence" />
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {paymentAssurances.map((item) => (
            <li key={item.title} className="border-t border-border pt-5">
              <ShieldCheck className="size-5 text-olive" aria-hidden />
              <h3 className="mt-3 font-display text-lg">{item.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 flex flex-wrap gap-4 border-t border-border pt-8">
        <Button asChild>
          <Link to="/shop">Browse the range</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/build-your-box">Build your own box</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link to="/business">Corporate & wholesale terms</Link>
        </Button>
      </div>
    </div>
  );
}
