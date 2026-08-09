import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { collections, getProductsByCollection } from "@/data/catalog";

export const Route = createFileRoute("/collections/")({
  head: () => ({
    meta: [
      { title: "Collections — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Explore Oasis Baklawa collections: the signature range, gifting selections, seasonal additions and the corporate selection.",
      },
      { property: "og:title", content: "Collections — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Curated Oasis Baklawa collections for gifting, hosting and everyday.",
      },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  return (
    <div className="pb-20">
      <div className="container-oasis py-8 md:py-12">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Collections" }]} />
        <SectionHeading
          as="h1"
          eyebrow="Curated"
          title="Collections"
          intro="Groupings from the kitchen — organised by how the range is usually chosen."
          className="mt-6"
        />

        <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2">
          {collections.map((collection, i) => {
            const count = getProductsByCollection(collection.id).length;
            return (
              <article key={collection.id} className="group">
                <Link
                  to="/collections/$slug"
                  params={{ slug: collection.slug }}
                  className="block overflow-hidden rounded-sm bg-premium"
                >
                  <img
                    src={collection.image.src}
                    alt={collection.image.alt}
                    width={1200}
                    height={800}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="aspect-[3/2] size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
                  />
                </Link>
                <p className="eyebrow mt-5">{collection.kicker}</p>
                <h2 className="mt-2 font-display text-2xl">
                  <Link
                    to="/collections/$slug"
                    params={{ slug: collection.slug }}
                    className="link-underline after:bg-driftwood"
                  >
                    {collection.name}
                  </Link>
                </h2>
                <p className="mt-3 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {collection.description}
                </p>
                <p className="mt-3 text-[0.75rem] uppercase tracking-[0.12em] text-driftwood">
                  {count} {count === 1 ? "product" : "products"}
                </p>
              </article>
            );
          })}
        </div>
      </div>

      <NewsletterModule />
    </div>
  );
}
