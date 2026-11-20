import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { DeliveryEstimator } from "@/components/oasis/delivery-estimator";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";

const DESCRIPTION =
  "Confirm Oasis Baklawa delivery availability and shipping arrangements with our team. Online PIN-code estimates and rates are not currently verified.";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Enquiries | Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { name: "robots", content: "noindex, follow" },
      { property: "og:title", content: "Shipping & Delivery — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
    ],
    // Do not publish FAQ structured data derived from provisional local rates,
    // zone assignments or dispatch cut-offs as verified operational policy.
  }),
  component: ShippingPage,
});

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
          title="Confirm your delivery arrangements"
          intro="Delivery eligibility, charges, packing and estimated arrival dates depend on the destination and accepted order. The online serviceability and delivery-quote integration has not been certified."
        />
      </section>

      <section className="container-oasis mt-12">
        <DeliveryEstimator />
      </section>

      <section className="container-oasis mt-12 grid gap-6 md:grid-cols-2">
        <article className="border border-border bg-premium p-6">
          <h2 className="font-display text-xl">Individual and gift orders</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Share the destination PIN code, desired date and the products you are considering. Our
            team will confirm whether the order can be delivered and provide applicable terms before
            an order is accepted.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/contact">Contact the team</Link>
          </Button>
        </article>

        <article className="border border-border bg-premium p-6">
          <h2 className="font-display text-xl">Corporate and multi-address gifting</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Bulk dispatch, multi-recipient delivery and event dates require a quotation and
            operational confirmation. No automated delivery window or shipping fee shown elsewhere
            on the preview site is an accepted offer.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link to="/business">Make a business enquiry</Link>
          </Button>
        </article>
      </section>
    </div>
  );
}
