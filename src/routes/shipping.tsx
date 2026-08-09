import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { DeliveryEstimator } from "@/components/oasis/delivery-estimator";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  packagingNotes,
  serviceLevels,
  shippingFaqs,
  shippingPolicies,
  shippingZones,
} from "@/data/shipping";

const DESCRIPTION =
  "Delivery times, shipping zones, service levels, packaging and order tracking for Oasis Baklawa — check an estimated delivery window by PIN code.";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery — Times, Zones & Tracking | Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Shipping & Delivery — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: shippingFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: ShippingPage,
});

const icons = [Truck, Clock, PackageCheck, ShieldCheck];

function ShippingPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shipping & delivery" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Shipping & delivery"
          title="How your order reaches you"
          intro="Small-batch preparation, insulated packing and tracked dispatch. Times below are indicative placeholders in this build and will be confirmed against live carrier data."
          action={
            <Button asChild variant="outline">
              <Link to="/track-order">Track an order</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12">
        <DeliveryEstimator />
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Service levels" title="Choose how quickly it travels" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {serviceLevels.map((level, i) => {
            const Icon = icons[i % icons.length] ?? Truck;
            return (
              <article key={level.id} className="flex gap-4 border border-border bg-premium p-6">
                <Icon className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                <div className="min-w-0">
                  <h3 className="font-display text-xl">{level.name}</h3>
                  <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                    {level.summary}
                  </p>
                  <dl className="mt-4 grid gap-1 text-[0.8125rem] text-driftwood">
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-[0.12em]">Cut-off</dt>
                      <dd>{String(level.cutoffHour).padStart(2, "0")}:00 local</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-[0.12em]">Fee</dt>
                      <dd>{level.feeNote}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="uppercase tracking-[0.12em]">Where</dt>
                      <dd>{level.availability}</dd>
                    </div>
                  </dl>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Zones"
            title="Delivery zones and transit windows"
            intro="PIN codes are routed to one of four zones. Unlisted PIN codes fall to the extended network."
          />
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-[0.875rem]">
              <caption className="sr-only">Delivery zones with transit times and available services</caption>
              <thead>
                <tr className="border-b border-border text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                  <th scope="col" className="py-3 pr-4 font-normal">Zone</th>
                  <th scope="col" className="py-3 pr-4 font-normal">Transit</th>
                  <th scope="col" className="py-3 font-normal">Services</th>
                </tr>
              </thead>
              <tbody>
                {shippingZones.map((zone) => (
                  <tr key={zone.id} className="border-b border-border/70 align-top">
                    <th scope="row" className="py-4 pr-4 font-normal">
                      <span className="font-display text-base">{zone.name}</span>
                      <span className="mt-1 block text-[0.8125rem] text-muted-foreground">{zone.blurb}</span>
                    </th>
                    <td className="py-4 pr-4 text-muted-foreground">
                      {zone.minDays === 0 ? "Same day" : `${zone.minDays}`}
                      {zone.minDays === 0 ? ` – ${zone.maxDays} working day` : `–${zone.maxDays} working days`}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {zone.services
                        .map((id) => serviceLevels.find((s) => s.id === id)?.name ?? id)
                        .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Packaging" title="How it is packed" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {packagingNotes.map((note) => (
            <article key={note.title} className="border border-border p-6">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg">{note.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-oasis">
        <div className="grid gap-10 border-t border-border pt-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Policies" title="The details worth knowing" />
            <ul className="mt-8 grid gap-6">
              {shippingPolicies.map((policy) => (
                <li key={policy.title} className="flex gap-3">
                  <Check className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-lg">{policy.title}</h3>
                    <p className="mt-1 text-[0.875rem] leading-relaxed text-muted-foreground">
                      {policy.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading eyebrow="Questions" title="Shipping FAQ" />
            <Accordion type="single" collapsible className="mt-8">
              {shippingFaqs.map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger className="text-left font-display text-base">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-10 border border-border bg-utility p-6">
              <h3 className="font-display text-lg">Bulk or corporate consignments</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                Multi-box and multi-address dispatch is scheduled with the corporate team so packing,
                freight and delivery windows are planned together.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/business">Corporate & B2B</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/contact">Contact us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
