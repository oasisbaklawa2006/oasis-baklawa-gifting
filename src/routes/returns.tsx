import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";

const DESCRIPTION =
  "Returns, cancellations and refunds for Oasis Baklawa orders: what we can change, when, and how to reach us.";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Returns, Cancellations & Refunds — Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Returns, Cancellations & Refunds — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReturnsPage,
});

const SECTIONS = [
  {
    title: "Changing or cancelling an order",
    body: "Everything is prepared fresh to order, so we can only change or cancel an order before it is packed. Send us your reference as soon as possible and we will confirm what is still possible for that order.",
  },
  {
    title: "Food safety and returns",
    body: "For food-safety reasons we cannot accept the return of sweets, chocolates or dates once they have been delivered and accepted. This does not affect your rights where an order arrives damaged, incorrect or not as described.",
  },
  {
    title: "If something arrives damaged or incorrect",
    body: "Tell us within 48 hours of delivery, with your order reference and photographs of the outer box and the contents. We will arrange a replacement or a refund of the affected items.",
  },
  {
    title: "Failed or refused deliveries",
    body: "If nobody is available, the courier will attempt delivery again. Where a parcel is refused or cannot be delivered after repeated attempts, perishable contents cannot be re-dispatched; we will contact you to agree the next step.",
  },
  {
    title: "How refunds are made",
    body: "Approved refunds are returned to the original payment method. The time it takes to appear depends on your bank or card issuer.",
  },
];

function ReturnsPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Returns & refunds" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Policies"
          title="Returns, cancellations & refunds"
          intro="Fresh food needs a slightly different policy from most shopping. Here is exactly how we handle changes, damage and refunds."
          action={
            <Button asChild variant="outline">
              <Link to="/support">Get help with an order</Link>
            </Button>
          }
        />
      </section>

      <section className="container-oasis mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <article key={section.title}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}

        <div className="border border-border bg-premium p-6">
          <h2 className="font-display text-xl">Raise a request</h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
            Use the help form with your order reference and we will reply within one working day.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/support">Help with an order</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shipping">Shipping & delivery</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
