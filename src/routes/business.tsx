import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { useLeadForm } from "@/lib/marketing/use-lead-form";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { b2bProcess, capabilities } from "@/data/site";
import { products } from "@/data/catalog";
import giftImage from "@/assets/product-giftbox.jpg";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Corporate Gifting & Wholesale Supply — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Oasis Baklawa for business: wholesale and retail supply, corporate gifting programmes, custom requirements and supply for hotels, restaurants and caterers.",
      },
      { property: "og:title", content: "Corporate & B2B — Oasis Baklawa" },
      {
        property: "og:description",
        content:
          "Wholesale supply, corporate gifting and custom formats. Request a catalogue or speak to sales.",
      },
    ],
  }),
  component: BusinessPage,
});

const audiences = [
  "Retailer",
  "Corporate gifting buyer",
  "Hotel / restaurant / caterer",
  "Distributor / export",
];

function EnquiryForm() {
  const lead = useLeadForm({
    kind: "corporate",
    source: "business-page",
    event: "corporate_gifting_lead",
    properties: ["type"],
    successMessage: "Your enquiry has been received and saved for our commercial team.",
    failureMessage: "We could not save your enquiry. Please try again or contact our team.",
  });

  return (
    <form
      onSubmit={lead.onSubmit}
      className="border border-border bg-background p-6 md:p-8"
      noValidate={false}
    >
      <h3 className="font-display text-2xl">Business enquiry</h3>
      <p className="mt-2 text-[0.8125rem] text-muted-foreground">
        Share your requirement. We will confirm availability, pricing and timelines before
        making any commitment.
      </p>

      <div className="mt-7 grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="b2b-name">Full name</Label>
          <Input
            id="b2b-name"
            name="name"
            required
            autoComplete="name"
            className="h-11 rounded-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="b2b-company">Company</Label>
          <Input
            id="b2b-company"
            name="company"
            required
            autoComplete="organization"
            className="h-11 rounded-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="b2b-email">Work email</Label>
          <Input
            id="b2b-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 rounded-sm"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="b2b-phone">Phone</Label>
          <Input
            id="b2b-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className="h-11 rounded-sm"
          />
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="b2b-type">Business type</Label>
          <Select name="type">
            <SelectTrigger id="b2b-type" className="h-11 rounded-sm">
              <SelectValue placeholder="Select a business type" />
            </SelectTrigger>
            <SelectContent>
              {audiences.map((audience) => (
                <SelectItem key={audience} value={audience}>
                  {audience}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 sm:col-span-2">
          <Label htmlFor="b2b-message">Requirement</Label>
          <Textarea
            id="b2b-message"
            name="message"
            rows={4}
            placeholder="Volumes, formats, timelines"
            className="rounded-sm"
          />
        </div>
      </div>

      <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto" disabled={lead.pending}>
        {lead.pending ? "Sending…" : "Send enquiry"}
      </Button>
      <p aria-live="polite" className="mt-3 text-[0.8125rem] text-muted-foreground">
        {lead.statusMessage ?? "We will acknowledge your enquiry after it has been saved."}
      </p>
    </form>
  );
}

function BusinessPage() {
  const range = products.filter((p) => p.occasions.includes("Corporate")).slice(0, 4);

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Corporate & B2B" }]} />
      </div>

      <section className="container-oasis grid gap-10 pb-8 pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            Oasis for business
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] md:text-[3.25rem]">
            Supply and gifting, handled properly
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            We work with retailers, corporate gifting buyers, hospitality operators and
            distributors. Tell us the requirement and we will confirm what is feasible before
            anything is promised.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button size="lg" asChild>
              <a href="#enquiry">Request catalogue</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#enquiry">Speak to sales</a>
            </Button>
            <Button size="lg" variant="ghost" className="justify-start sm:justify-center" disabled>
              Existing business customer — sign in (coming soon)
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-sm bg-premium">
          <div className="aspect-[5/4]">
            <img
              src={giftImage}
              alt="A corporate gift box presented on a warm ivory surface"
              width={1200}
              height={960}
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="Capabilities"
          title="What we can support"
          intro="Descriptions of scope only. Volumes, pricing and timelines are confirmed per enquiry."
        />
        <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
          {capabilities.map((capability) => (
            <article key={capability.id} className="bg-background p-7 lg:p-9">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-5 font-display text-2xl">{capability.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {capability.summary}
              </p>
              <ul className="mt-6 space-y-3">
                {capability.points.map((point) => (
                  <li
                    key={point}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-[0.875rem]"
                  >
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-utility">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Product range"
            title="Formats suited to volume"
            action={
              <Button asChild variant="outline">
                <Link to="/shop">See the full range</Link>
              </Button>
            }
          />
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {range.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Process" title="How an enquiry moves" />
        <ol className="mt-12 grid gap-px border border-border bg-border md:grid-cols-4">
          {b2bProcess.map((step) => (
            <li key={step.step} className="bg-background p-6">
              <p className="font-display text-3xl text-sand">{step.step}</p>
              <h3 className="mt-3 font-display text-xl">{step.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {step.detail}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Why work with Oasis"
              title="Straightforward, on the record"
              intro="We describe only what we can deliver. Anything beyond that is confirmed in writing before you commit."
            />
            <ul className="mt-10 space-y-5 border-t border-border pt-8">
              {[
                "A defined range with consistent presentation",
                "Clear specification sheets on request",
                "Feasibility confirmed before commitment",
                "A single point of contact for your account",
              ].map((point) => (
                <li
                  key={point}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 text-[0.9375rem]"
                >
                  <ArrowUpRight className="mt-1 size-4 shrink-0 text-gold" aria-hidden="true" />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div id="enquiry" className="scroll-mt-28">
            <EnquiryForm />
          </div>
        </div>
      </section>
    </>
  );
}
