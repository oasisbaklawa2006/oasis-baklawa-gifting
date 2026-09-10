import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { CategoryHero } from "@/components/oasis/catalog-browser";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brandMedia, contact, productMedia } from "@/data/brand";
import { products } from "@/data/catalog";
import { canonicalUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/wedding-gifting")({
  head: () => ({
    meta: [
      { title: "Wedding & Mehendi Gifting — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Wedding, mehendi and welcome gifting from Oasis Baklawa: presentation chests for families, matched favours for guests and customisation agreed before production.",
      },
      { property: "og:title", content: "Wedding & Mehendi Gifting — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Presentation chests for families and matched favours for guests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: siteUrl("/wedding-gifting") },
      { property: "og:image", content: productMedia["rosello-25"]!.src },
      { name: "twitter:image", content: productMedia["rosello-25"]!.src },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/wedding-gifting") }],
  }),
  component: WeddingGiftingPage,
});

const strands = [
  {
    title: "Wedding gifts",
    copy: "Larger presentation chests for the families at the centre of the day, arranged to a single specification.",
    giftType: "premium-gifting",
  },
  {
    title: "Mehendi gifting",
    copy: "Lighter boxes for the evening — sweets, dates and chocolate in matched presentation.",
    giftType: "assortment-gifts",
  },
  {
    title: "Welcome hampers & favours",
    copy: "Compact matched boxes produced in quantity for guests and room drops. Formats confirmed on enquiry.",
    giftType: "gift-hampers",
  },
];

function WeddingGiftingPage() {
  const [sent, setSent] = useState(false);
  const curated = products
    .filter((product) => product.occasions.some((o) => o === "Wedding" || o === "Mehendi"))
    .slice(0, 8);

  return (
    <>
      <CategoryHero
        eyebrow="Wedding & mehendi"
        title="Gifting for the days around the day"
        intro="Chests for the families, matched boxes for the guests, and one specification held across every piece. Quantities, personalisation and timelines are agreed with our team before production."
        image={brandMedia.giftBanner}
      />

      <div className="container-oasis pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wedding Gifting" }]} />
      </div>

      <section className="container-oasis section-y">
        <ul className="grid gap-px border border-border bg-border md:grid-cols-3">
          {strands.map((strand) => (
            <li key={strand.title} className="bg-background p-7">
              <span className="gold-rule block" aria-hidden="true" />
              <h2 className="mt-4 font-display text-xl">{strand.title}</h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {strand.copy}
              </p>
              <Link
                to="/luxury-gifts"
                search={{ giftType: strand.giftType }}
                className="link-underline mt-5 inline-block text-[0.8125rem] uppercase tracking-[0.14em] text-earth"
              >
                View formats
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {curated.length > 0 ? (
        <section className="border-y border-border bg-premium">
          <div className="container-oasis section-y">
            <SectionHeading
              eyebrow="Curated"
              title="Formats chosen for weddings"
              action={
                <Button asChild variant="outline">
                  <Link to="/luxury-gifts" search={{ recipient: "couple-wedding" }}>
                    All wedding gifting
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {curated.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-oasis section-y">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div className="max-w-xl">
            <SectionHeading eyebrow="Customisation" title="What can be adapted" as="h2" />
            <ul className="mt-8 space-y-4 text-[0.9375rem] text-muted-foreground">
              {[
                "Contents chosen from the current range",
                "Box, chest and hamper formats across one order",
                "Ribbon and seal finishes held consistent across quantity",
                "Message cards and name cards, confirmed per order",
                "Dispatch coordinated to one or several addresses",
              ].map((point) => (
                <li key={point} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                    aria-hidden="true"
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-8 text-[0.875rem] text-muted-foreground">
              Prefer to speak to someone? Call {contact.phone} or write to {contact.email}.
            </p>
          </div>

          <form
            className="rounded-sm border border-border bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
              toast.success("Enquiry noted", {
                description: `Please also reach us on ${contact.phone} so we can confirm dates.`,
              });
            }}
          >
            <p className="eyebrow">Wedding enquiry</p>
            <div className="mt-5 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="w-name">Name</Label>
                <Input id="w-name" name="name" required autoComplete="name" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="w-email">Email</Label>
                  <Input id="w-email" name="email" type="email" required autoComplete="email" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w-phone">Phone</Label>
                  <Input id="w-phone" name="phone" type="tel" autoComplete="tel" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="w-date">Event date</Label>
                  <Input id="w-date" name="date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="w-qty">Approximate quantity</Label>
                  <Input id="w-qty" name="quantity" inputMode="numeric" placeholder="e.g. 150" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="w-brief">Brief</Label>
                <Textarea
                  id="w-brief"
                  name="brief"
                  rows={4}
                  placeholder="Occasions, cities, presentation preferences."
                />
              </div>
              <Button type="submit" size="lg" className="mt-2">
                Request an appointment
              </Button>
              <p aria-live="polite" className="text-xs text-muted-foreground">
                {sent
                  ? `Thank you. So we can confirm your dates without delay, please also call ${contact.phone}.`
                  : `Enquiries are answered by our gifting team on ${contact.phone}.`}
              </p>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
