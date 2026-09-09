import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";

const DESCRIPTION =
  "The terms that apply when you order from Oasis Baklawa: orders, pricing, delivery, gifting and support.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Sale & Use — Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Terms of Sale & Use — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

const SECTIONS = [
  {
    title: "Placing an order",
    body: "An order is an offer to buy. It becomes binding once we confirm it and give you an order reference. We may decline an order where an item cannot be prepared or delivered to the address given.",
  },
  {
    title: "Prices and payment",
    body: "Prices are shown in Indian Rupees and are confirmed by our order system before payment is taken. Payment is settled in Indian Rupees regardless of the currency a price is displayed in.",
  },
  {
    title: "Delivery",
    body: "Delivery timings shown on the site are estimates based on your PIN code, the service chosen and the daily cut-off. Weather, festival traffic and courier delays can affect them. Delivery terms are set out in full on the shipping page.",
  },
  {
    title: "Product information",
    body: "Photography is representative. Ingredients, allergen information, storage guidance and shelf life are published against each product as declared by our kitchen. If you have a serious allergy, contact us before ordering.",
  },
  {
    title: "Gifting",
    body: "Gift messages are printed as written. Where you ask for the invoice to be concealed, no price information travels with the parcel. We cannot verify the accuracy of recipient addresses you supply.",
  },
  {
    title: "Cancellations and refunds",
    body: "Because everything is made fresh, cancellations and refunds follow our returns policy.",
  },
  {
    title: "Using this website",
    body: "Content, photography and brand marks on this site belong to the business that operates it and may not be reproduced commercially without permission.",
  },
];

function TermsPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Terms" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading as="h1" eyebrow="Policies" title="Terms of sale & use" />
      </section>

      <section className="container-oasis mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <article key={section.title}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link to="/returns">Returns & refunds</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link to="/privacy">Privacy notice</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
