import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ArticleCard } from "@/components/oasis/article-card";
import { StoreCard } from "@/components/oasis/story-cards";
import { Button } from "@/components/ui/button";
import { brand, brandMedia, brandStory } from "@/data/brand";
import { articlesByDate } from "@/data/journal";
import { stores } from "@/data/site";
import { canonicalUrl, siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/world-of-oasis")({
  head: () => ({
    meta: [
      { title: "World of Oasis — Story, Production, Craft & Stores" },
      {
        name: "description",
        content:
          "The Oasis Baklawa house: a family story that began with imported Dubai baklava, production at Kirti Nagar in New Delhi, the craft behind the pastry, our stores and the Journal.",
      },
      { property: "og:title", content: "World of Oasis" },
      {
        property: "og:description",
        content: "Story, production, craft, stores and the Oasis Journal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: siteUrl("/world-of-oasis") },
      { property: "og:image", content: brandMedia.factory.src },
      { name: "twitter:image", content: brandMedia.factory.src },
    ],
    links: [{ rel: "canonical", href: canonicalUrl("/world-of-oasis") }],
  }),
  component: WorldOfOasisPage,
});

function WorldOfOasisPage() {
  return (
    <>
      <section className="border-b border-border bg-premium">
        <div className="container-oasis grid items-center gap-10 py-12 lg:grid-cols-2 lg:gap-16 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow flex items-center gap-3">
              <span className="gold-rule inline-block" aria-hidden="true" />
              World of Oasis
            </p>
            <h1 className="mt-5 text-[2.25rem] leading-[1.1] sm:text-5xl">
              A family house, built order by order
            </h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{brand.mission}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button asChild>
                <Link to="/about">Our story</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/business">Our production</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-sm bg-background">
            <div className="aspect-[16/11]">
              <img
                src={brandMedia.factory.src}
                alt={brandMedia.factory.alt}
                width={1600}
                height={1100}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="container-oasis pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "World of Oasis" }]} />
      </div>

      <section className="container-oasis section-y">
        <SectionHeading eyebrow="The story" title="From two table setups to Kirti Nagar" />
        <ol className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
          {brandStory.map((chapter) => (
            <li key={chapter.title} className="border-t border-border pt-5">
              <h3 className="font-display text-xl">{chapter.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {chapter.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-sm bg-background">
            <div className="aspect-[4/3]">
              <img
                src={brandMedia.craft.src}
                alt={brandMedia.craft.alt}
                width={1400}
                height={1050}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
          <div>
            <p className="eyebrow">The art of baklawa</p>
            <h2 className="mt-4 text-3xl leading-tight md:text-[2.5rem]">
              A patient craft, presented plainly
            </h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Sheets of filo laid thin, brushed with clarified butter and layered before the nuts go
              in. Production, packaging, distribution and customer experience sit under one roof at
              our unit in Kirti Nagar, New Delhi.
            </p>
            <ul className="mt-8 grid gap-4 border-t border-border pt-8 text-[0.9375rem] text-muted-foreground">
              {brand.coreValues.map((value) => (
                <li key={value.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
                  <span
                    className="mt-2 size-1.5 shrink-0 rounded-full bg-gold"
                    aria-hidden="true"
                  />
                  <span>
                    <strong className="font-normal text-foreground">{value.title}</strong> —{" "}
                    {value.detail}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline" className="mt-9">
              <Link to="/baklawa">Shop baklawa</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="Stores"
          title="Find us in person"
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

      <section className="container-oasis pb-20">
        <SectionHeading
          eyebrow="The Journal"
          title="Notes on gifting, ingredients and craft"
          action={
            <Button asChild variant="outline">
              <Link to="/journal">Read the Journal</Link>
            </Button>
          }
        />
        <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-3">
          {articlesByDate.slice(0, 3).map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
        <div className="mt-12">
          <Button asChild variant="ghost" className="px-0">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
