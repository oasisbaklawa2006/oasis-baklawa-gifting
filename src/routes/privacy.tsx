import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { Button } from "@/components/ui/button";

const DESCRIPTION =
  "How Oasis Baklawa collects, uses and protects the information you give us when you shop, gift or get in touch.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice — Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Privacy Notice — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS = [
  {
    title: "What we collect",
    body: "The details you give us to complete an order or answer an enquiry: your name, delivery and billing address, phone number, email address, any gift message you write, and the contents of your order. Payment card details are handled by our payment provider and are never stored on this website.",
  },
  {
    title: "Why we use it",
    body: "To prepare, pack, deliver and support your order; to answer enquiries; to meet accounting and tax obligations; and, only if you have asked for it, to send occasional letters about new arrivals and gifting.",
  },
  {
    title: "Who we share it with",
    body: "Only the parties needed to fulfil your order: our delivery partners, our payment provider and the systems that run our kitchen and order management. We do not sell personal information.",
  },
  {
    title: "Gift messages and concealed pricing",
    body: "Gift messages are printed exactly as you write them and are visible only to the recipient. Where you ask us to conceal the invoice, no price information is included in the parcel.",
  },
  {
    title: "Cookies and measurement",
    body: "This site uses only what it needs to work. Measurement and advertising tags load only when they have been configured and where you have consented; a device-only store keeps your bag, saved gifts and any addresses you save for your own convenience.",
  },
  {
    title: "Your choices",
    body: "You can ask us for a copy of the information we hold about you, ask us to correct it, or ask us to delete it where we are not required to keep it. Contact us and we will confirm what we can do.",
  },
];

function PrivacyPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Privacy" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Policies"
          title="Privacy notice"
          intro="Plainly: we ask for what an order needs, we use it to get your gift where it is going, and we keep it to ourselves."
        />
      </section>

      <section className="container-oasis mt-12 max-w-3xl space-y-10">
        {SECTIONS.map((section) => (
          <article key={section.title}>
            <h2 className="font-display text-xl">{section.title}</h2>
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{section.body}</p>
          </article>
        ))}
        <Button variant="outline" asChild>
          <Link to="/contact">Contact us about privacy</Link>
        </Button>
      </section>
    </div>
  );
}
