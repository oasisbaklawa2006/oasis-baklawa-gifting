import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { faqs } from "@/data/site";
import { canonicalUrl } from "@/lib/site-url";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — Orders, Ingredients & Delivery | Oasis Baklawa" },
      {
        name: "description",
        content:
          "Answers on Oasis Baklawa orders, ingredients and allergens, storage, delivery, gifting and corporate supply.",
      },
      { property: "og:title", content: "Frequently Asked Questions — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Common questions about ordering, ingredients, delivery and gifting.",
      },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/faq") }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.flatMap((group) =>
            group.items.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          ),
        }),
      },
    ],
  }),

  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "FAQ" }]} />
        <SectionHeading
          as="h1"
          eyebrow="Help"
          title="Frequently asked questions"
          intro="Answers reflect the current stage of the platform. Details will be firmed up as ordering and delivery go live."
          className="mt-6"
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div className="space-y-12">
            {faqs.map((group) => (
              <section key={group.category}>
                <h2 className="eyebrow flex items-center gap-3">
                  <span className="gold-rule inline-block" aria-hidden="true" />
                  {group.category}
                </h2>
                <Accordion type="single" collapsible className="mt-4">
                  {group.items.map((item) => (
                    <AccordionItem key={item.q} value={item.q} className="border-border">
                      <AccordionTrigger className="text-left text-[0.9375rem]">{item.q}</AccordionTrigger>
                      <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </section>
            ))}
          </div>

          <aside className="h-fit border border-border bg-premium p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-xl">Still need help?</h2>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-muted-foreground">
              Send us the details and we'll come back to you.
            </p>
            <div className="mt-5 grid gap-2">
              <Button asChild>
                <Link to="/contact">Contact us</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/business">Business enquiry</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
