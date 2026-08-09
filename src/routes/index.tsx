import { createFileRoute, Link } from "@tanstack/react-router";

import { Hero } from "@/components/home/hero";
import { BusinessSplit, CraftsmanshipModule, GiftingModule } from "@/components/home/editorial";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { CategoryTile, CollectionCard } from "@/components/oasis/cards";
import { TrustStrip } from "@/components/oasis/trust-strip";
import { StoreCard, TestimonialCard } from "@/components/oasis/story-cards";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { ChannelStrip } from "@/components/oasis/channel-links";
import { PartnershipModule } from "@/components/oasis/partnership-module";
import { Button } from "@/components/ui/button";
import { bestSellers, categories, collections, getProductsByCollection } from "@/data/catalog";
import { stores, testimonials } from "@/data/site";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oasis Baklawa — Baklawa & Arabic Sweets, Made in Small Batches" },
      {
        name: "description",
        content:
          "Pistachio baklawa, Arabic sweets and gift boxes from Oasis Baklawa. Shop the signature collection or enquire about corporate gifting and wholesale supply.",
      },
      { property: "og:title", content: "Oasis Baklawa — Baklawa & Arabic Sweets" },
      {
        property: "og:description",
        content: "Baklawa and Arabic sweets made in small batches and boxed for gifting.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const seasonal = getProductsByCollection("col-seasonal");

  return (
    <>
      <Hero />

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="Shop by category"
          title="Signature collections"
          intro="Four ways into the range — from the daily baklawa tray to boxed gifting."
          action={
            <Button asChild variant="outline">
              <Link to="/shop">View all products</Link>
            </Button>
          }
        />
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {categories.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-utility">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Best sellers"
            title="What leaves the kitchen first"
            action={
              <Button asChild variant="outline">
                <Link to="/shop">Shop all</Link>
              </Button>
            }
          />
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {bestSellers.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <GiftingModule />

      <CraftsmanshipModule />

      <BusinessSplit />

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="New &amp; noteworthy"
          title="Recent additions and seasonal runs"
          intro="Limited formats introduced through the year, alongside the permanent range."
        />
        <div className="mt-12 grid gap-x-5 gap-y-12 md:grid-cols-2">
          {collections.slice(1, 3).map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {seasonal.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <TrustStrip />

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="Stores"
          title="Find us in person"
          intro="Store details are placeholders in this build and will be confirmed before launch."
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

      <section className="border-t border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="In their words"
            title="Reviews, once collected"
            intro="This section is reserved for verified customer feedback. The cards below are placeholders."
          />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </section>

      <ChannelStrip />

      <PartnershipModule />

      <NewsletterModule />

    </>
  );
}
