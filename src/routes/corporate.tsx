import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Globe2, Handshake, Store, Users } from "lucide-react";
import { useLeadForm } from "@/lib/marketing/use-lead-form";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { RecipientImport } from "@/components/oasis/recipient-import";
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
import { canonicalUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/corporate")({
  head: () => ({
    meta: [
      { title: "Corporate & Wholesale Gifting — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Corporate gifting, wholesale and retail supply, hospitality and distributor enquiries for Oasis Baklawa. Request a catalogue, a quote or speak to our sales team.",
      },
      { property: "og:title", content: "Corporate & Wholesale Gifting — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Enterprise gifting, wholesale supply and distribution enquiries.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: siteUrl("/corporate") },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/corporate") }],
  }),
  component: CorporatePage,
});

const pillars = [
  {
    icon: Store,
    title: "Wholesale & retail supply",
    copy: "Repeat supply for retailers and speciality counters, produced to a fixed specification.",
  },
  {
    icon: Users,
    title: "Corporate gifting",
    copy: "Client, partner and employee programmes with consistent presentation across dispatch.",
  },
  {
    icon: Building2,
    title: "Hospitality",
    copy: "Amenity, banqueting and in-room formats for hotels and event partners.",
  },
  {
    icon: Globe2,
    title: "Distributor & export",
    copy: "Territory conversations handled case by case with our commercial team.",
  },
];

const workflow = [
  { step: "01", title: "Brief", copy: "Volume, occasion, budget band and delivery window." },
  {
    step: "02",
    title: "Selection",
    copy: "We propose formats and contents from the current range.",
  },
  { step: "03", title: "Approval", copy: "Samples and presentation signed off before production." },
  {
    step: "04",
    title: "Dispatch",
    copy: "Consolidated or multi-address dispatch, tracked throughout.",
  },
];

function CorporatePage() {
  const lead = useLeadForm({
    kind: "corporate",
    source: "corporate-page",
    event: "corporate_gifting_lead",
    properties: ["quantity", "date"],
    successMessage: "Thank you — your enquiry is with our commercial team.",
    failureMessage: "We couldn’t send this just now. Please try again, or call us directly.",
  });

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Corporate" }]} />
      </div>

      <section className="container-oasis grid gap-10 pb-4 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-end">
        <div className="max-w-2xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            For business
          </p>
          <h1 className="mt-4 text-4xl leading-[1.1] md:text-[3.25rem]">
            Gifting programmes and supply, handled properly
          </h1>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Oasis Baklawa works with companies, retailers and hospitality partners on gifting and
            supply across our baklawa, dates, chocolate and confection ranges. Volumes, formats and
            timelines are agreed with our team before anything is produced.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#corporate-enquiry">Request a quote</a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#corporate-enquiry">Request catalogue</a>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link to="/contact">Speak to sales</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-sm border border-border bg-premium p-6">
          <p className="eyebrow">Existing business customer</p>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
            A business account area with order history, repeat ordering and GST invoicing is
            planned. Until it opens, please reach us through the enquiry form.
          </p>
          <Button variant="outline" className="mt-5 w-full" disabled>
            Account sign-in — coming soon
          </Button>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Capabilities" title="What we take on" />
        <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map(({ icon: Icon, title, copy }) => (
            <li key={title}>
              <Icon className="size-5 text-gold" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl">{title}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">{copy}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading eyebrow="Bulk gifting" title="How a programme runs" />
          <ol className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((w) => (
              <li key={w.step} className="border-t border-border pt-5">
                <p className="font-display text-2xl text-driftwood">{w.step}</p>
                <h3 className="mt-3 font-display text-lg">{w.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                  {w.copy}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-14">
            <RecipientImport />
          </div>
        </div>
      </section>

      <section id="corporate-enquiry" className="container-oasis section-y scroll-mt-24">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="max-w-xl">
            <SectionHeading eyebrow="Enquiry" title="Tell us about your requirement" as="h2" />
            <p className="mt-6 text-[0.875rem] leading-relaxed text-muted-foreground">
              Share the outline and our commercial team will respond with formats, indicative
              pricing and a production timeline. Nothing is committed at this stage.
            </p>
            <ul className="mt-8 grid gap-3 text-[0.875rem] text-muted-foreground">
              <li className="flex gap-3">
                <Handshake className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                Programmes are quoted individually — there is no fixed rate card.
              </li>
              <li className="flex gap-3">
                <Building2 className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                Production is at our facility in Kirti Nagar, New Delhi.
              </li>
            </ul>
          </div>

          <form className="rounded-sm border border-border bg-card p-6" onSubmit={lead.onSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="c-company">Company</Label>
                <Input id="c-company" name="company" required autoComplete="organization" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-name">Contact name</Label>
                <Input id="c-name" name="name" required autoComplete="name" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="c-email">Work email</Label>
                  <Input id="c-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-phone">Phone</Label>
                  <Input id="c-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-type">Enquiry type</Label>
                <Select defaultValue="corporate-gifting">
                  <SelectTrigger id="c-type">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="corporate-gifting">Corporate gifting</SelectItem>
                    <SelectItem value="wholesale">Wholesale &amp; retail supply</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="distribution">Distributor / export</SelectItem>
                    <SelectItem value="catering">Dessert catering</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="c-qty">Approximate quantity</Label>
                  <Input
                    id="c-qty"
                    name="quantity"
                    inputMode="numeric"
                    placeholder="e.g. 250 boxes"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="c-date">Required by</Label>
                  <Input id="c-date" name="date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="c-brief">Brief</Label>
                <Textarea
                  id="c-brief"
                  name="brief"
                  rows={4}
                  placeholder="Occasion, budget band, delivery cities."
                />
              </div>
              <Button type="submit" size="lg" className="mt-2" disabled={lead.pending}>
                {lead.pending ? "Sending…" : "Submit enquiry"}
              </Button>
              <p aria-live="polite" className="text-xs text-muted-foreground">
                {lead.statusMessage ??
                  "Our commercial team responds with formats, indicative pricing and timelines."}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
