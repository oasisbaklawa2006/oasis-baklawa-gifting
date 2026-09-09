import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EditorialModule } from "@/components/home/editorial";
import { StoreCard } from "@/components/oasis/story-cards";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { stores } from "@/data/site";
import { brand, brandMedia, brandStory, contact } from "@/data/brand";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Oasis Baklawa" },
      {
        name: "description",
        content:
          "A family-owned house that began by bringing baklava from Dubai to India and now makes baklawa, chocolates, confections and gifting at its own unit in Kirti Nagar, New Delhi.",
      },
      { property: "og:title", content: "Our Story — Oasis Baklawa" },
      {
        property: "og:description",
        content:
          "From two table setups at an exhibition to a production house in Kirti Nagar, New Delhi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: brandMedia.factory.src },
      { name: "twitter:image", content: brandMedia.factory.src },
    ],
  }),
  component: AboutPage,
});

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
            A family house, built on baklawa
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Oasis Baklawa began with a passion for chocolates, baklava and gifting. The first pieces
            were brought from a well-known Dubai patisserie and shown to India at exhibitions — from
            two table setups. Demand did the rest: production came home to Delhi, an in-house
            research team began developing products exclusive to Oasis, and the range widened into
            artisanal chocolates, confections and specialty gifting.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {brand.positioning}
          </p>
        </div>
        <div className="overflow-hidden rounded-sm bg-premium">
          <div className="aspect-[16/11]">
            <img
              src={brandMedia.hero.src}
              alt={brandMedia.hero.alt}
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
        <SectionHeading eyebrow="Heritage" title="How Oasis came to be" />
        <ol className="mt-12 grid gap-px border border-border bg-border md:grid-cols-5">
          {brandStory.map((item) => (
            <li key={item.title} className="bg-background p-6">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl">{item.title}</h3>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
                {item.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <EditorialModule
        eyebrow="Our production"
        title="Made at our own unit in Kirti Nagar"
        body="Quality, innovation, packaging and dispatch sit under one roof at our unit in Kirti Nagar, New Delhi, where our in-house team develops and produces the Oasis range."
        points={[
          "In-house research team developing products exclusive to Oasis",
          "Production, packing and dispatch at 10/62 Kirti Nagar Industrial Area",
          brand.manufacturingNote,
        ]}
        image={brandMedia.factory.src}
        imageAlt={brandMedia.factory.alt}
      />

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow">Vision</p>
            <h2 className="mt-4 font-display text-3xl leading-snug md:text-[2.25rem]">
              {brand.vision}
            </h2>
          </div>
          <div>
            <p className="eyebrow">Mission</p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">{brand.mission}</p>
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Core values" title="What we hold to" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {brand.coreValues.map((value) => (
            <article key={value.title} className="border border-border bg-background p-6">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg">{value.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {value.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-utility">
        <div className="container-oasis section-y grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div className="overflow-hidden rounded-sm">
            <img
              src={brandMedia.headOffice.src}
              alt={brandMedia.headOffice.alt}
              className="aspect-[4/3] size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div>
            <p className="eyebrow">The company</p>
            <h2 className="mt-4 font-display text-3xl leading-snug">{brand.legalOwner}</h2>
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
              The Oasis Baklawa brand is owned by {brand.legalOwner}. {brand.manufacturingNote}
            </p>
            <address className="mt-6 space-y-1 text-[0.9375rem] not-italic text-muted-foreground">
              {contact.headOffice.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <a href={contact.phoneHref} className="link-underline mt-2 block text-foreground">
                {contact.phone}
              </a>
              <a href={contact.emailHref} className="link-underline block text-foreground">
                {contact.email}
              </a>
            </address>
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
          {stores.slice(0, 3).map((store) => (
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
            <Button
              asChild
              variant="gold"
              size="lg"
              className="border-gold text-background hover:bg-truffle"
            >
              <Link to="/corporate">Corporate gifting</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-sand/40 text-background hover:bg-truffle"
            >
              <Link to="/stores">Visit a store</Link>
            </Button>
          </div>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
