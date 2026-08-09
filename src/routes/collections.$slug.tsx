import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { ProductCard } from "@/components/oasis/product-card";
import { SectionHeading } from "@/components/oasis/section-heading";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { collections, getProductsByCollection } from "@/data/catalog";
import type { Collection, Product } from "@/data/types";

export const Route = createFileRoute("/collections/$slug")({
  loader: ({ params }): { collection: Collection; items: Product[] } => {
    const collection = collections.find((c) => c.slug === params.slug);
    if (!collection) throw notFound();
    return { collection, items: getProductsByCollection(collection.id) };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Collection unavailable — Oasis Baklawa" }, { name: "robots", content: "noindex" }],
      };
    }
    const { collection } = loaderData;
    const description = collection.description;
    return {
      meta: [
        { title: `${collection.name} — Oasis Baklawa` },
        { name: "description", content: description },
        { property: "og:title", content: `${collection.name} — Oasis Baklawa` },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: CollectionNotFound,
  component: CollectionPage,
});

function CollectionNotFound() {
  return (
    <div className="container-oasis py-20">
      <EmptyState
        title="Collection not found"
        description="This collection may have been renamed or retired."
        action={
          <Button asChild>
            <Link to="/collections">All collections</Link>
          </Button>
        }
      />
    </div>
  );
}

function CollectionPage() {
  const { collection, items } = Route.useLoaderData() as { collection: Collection; items: Product[] };

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Collections", to: "/collections" },
            { label: collection.name },
          ]}
        />
      </div>

      <section className="container-oasis mt-6">
        <div className="grid items-center gap-8 border border-border bg-premium p-6 md:grid-cols-2 md:p-10">
          <div className="max-w-lg">
            <p className="eyebrow">{collection.kicker}</p>
            <h1 className="mt-3 text-3xl leading-tight md:text-[2.75rem]">{collection.name}</h1>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {collection.description}
            </p>
          </div>
          <img
            src={collection.image.src}
            alt={collection.image.alt}
            width={1200}
            height={900}
            decoding="async"
            className="aspect-[4/3] w-full rounded-sm object-cover"
          />
        </div>
      </section>

      <section className="container-oasis mt-14">
        <SectionHeading
          title={`${items.length} ${items.length === 1 ? "product" : "products"}`}
          action={
            <Button variant="outline" asChild>
              <Link to="/shop">Shop everything</Link>
            </Button>
          }
        />
        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Nothing here yet"
              description="Products will appear in this collection once assigned."
              action={
                <Button asChild>
                  <Link to="/shop">Browse the range</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
