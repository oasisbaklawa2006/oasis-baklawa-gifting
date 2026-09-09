import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EditorialModule } from "@/components/home/editorial";
import { StoreCard } from "@/components/oasis/story-cards";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { stores } from "@/data/site";
import heroImage from "@/assets/hero-baklawa.jpg";
import craftImage from "@/assets/craft-filo.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Oasis Baklawa: a family-owned Indian business that began with baklava from Dubai and now manufactures baklava, chocolates and confections in Kirti Nagar, New Delhi.",
      },
      { property: "og:title", content: "Our Story — Oasis Baklawa" },
      {
        property: "og:description",
        content: "A contemporary confectionery house built on traditional baklawa craft.",
      },
    ],
  }),
  component: AboutPage,
});

const philosophy = [
  {
    title: "Restraint",
    body: "Fewer components, better executed. Nothing on the plate that does not need to be there.",
  },
  {
    title: "Consistency",
    body: "The same recipe, the same cut, the same finish — every batch, every day.",
  },
  {
    title: "Presentation",
    body: "Packaging designed for the gift as much as the product inside it.",
  },
];

const timeline = [
  {
    year: "Origin",
    title: "Baklava from Dubai",
    body: "The business began by bringing baklava from a Dubai patisserie to customers in India.",
  },
  {
    year: "Evolution",
    title: "Manufacturing in Delhi",
    body: "Production moved in-house at our facility in Kirti Nagar, New Delhi.",
  },
  {
    year: "Range",
    title: "Beyond baklava",
    body: "The range widened into artisanal chocolates, confections and specialty gifts.",
  },
  {
    year: "Today",
    title: "Three audiences",
    body: "Consumer retail, corporate gifting and business supply, under TCF Chocolates & Gifts Pvt. Ltd.",
  },
];

function AboutPage() {
  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Our story" }]} />
      </div>

      <section className="container-oasis grid gap-10 pb-8 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
        <div className="max-w-xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            Our story
          </p>
          <h1 className="mt-5 text-4xl leading-[1.1] md:text-[3.25rem]">
            A confectionery house, quietly built
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Oasis Baklawa is a family-owned Indian business that began by bringing baklava from a Dubai
            patisserie to the Indian market. What started as an import grew into local manufacturing and a
            wider range of baklava, artisanal chocolates, confections and specialty gifts. The company
            trades as TCF Chocolates &amp; Gifts Pvt. Ltd., and production is based in Kirti Nagar, New Delhi.
          </p>
        </div>
        <div className="overflow-hidden rounded-sm bg-premium">
          <div className="aspect-[16/11]">
            <img
              src={heroImage}
              alt="A tray of freshly cut pistachio baklawa"
              width={1408}
              height={968}
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Philosophy" title="Three things we hold to" />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {philosophy.map((item) => (
            <article key={item.title} className="border-t border-border pt-6">
              <h3 className="font-display text-2xl">{item.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <EditorialModule
        eyebrow="Craftsmanship"
        title="The method has not changed"
        body="Filo rolled thin, brushed with clarified butter, layered with nuts and baked until the pastry holds its shape. What we control is the discipline: batch sizes, cutting, syrup and timing."
        points={[
          "Hand-laid pastry in controlled batch sizes",
          "Ingredient specifications to be published once finalised",
          "Quality checks at cutting, baking and packing",
        ]}
        image={craftImage}
        imageAlt="Filo pastry being brushed with clarified butter on a marble worktop"
      />

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Manufacturing & quality"
            title="Standards, stated plainly"
            intro="Certification and facility details will appear here once documentation is confirmed. We will not publish claims we cannot evidence."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {["Facility", "Quality controls", "Certifications", "Traceability"].map((item) => (
              <div key={item} className="border border-border bg-background p-6">
                <span className="gold-rule block" aria-hidden="true" />
                <h3 className="mt-4 font-display text-lg">{item}</h3>
                <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                  Details to be supplied by Oasis Baklawa.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Heritage" title="A timeline, to be completed" />
        <ol className="mt-12 grid gap-px border border-border bg-border md:grid-cols-4">
          {timeline.map((item) => (
            <li key={item.title} className="bg-background p-6">
              <p className="eyebrow">{item.year}</p>
              <h3 className="mt-3 font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-utility">
        <div className="container-oasis section-y grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Company"
              title="Leadership & credibility"
              intro="Leadership profiles, company registration details and press coverage will be published here once provided."
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {["Leadership", "Company information", "Press", "Careers"].map((item) => (
              <div key={item} className="border border-border bg-background p-6">
                <h3 className="font-display text-lg">{item}</h3>
                <p className="mt-2 text-[0.8125rem] text-muted-foreground">Content placeholder.</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="Footprint"
          title="Where to find us"
          action={
            <Button asChild variant="outline">
              <Link to="/stores">All stores</Link>
            </Button>
          }
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-espresso text-background">
        <div className="container-oasis section-y text-center">
          <p className="eyebrow text-sand">Get in touch</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl md:text-[2.5rem]">
            Talk to us about gifting, supply or partnership
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild variant="gold" size="lg" className="border-gold text-background hover:bg-truffle">
              <Link to="/business">Corporate &amp; B2B</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-sand/40 text-background hover:bg-truffle">
              <Link to="/stores">Visit a store</Link>
            </Button>
          </div>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
