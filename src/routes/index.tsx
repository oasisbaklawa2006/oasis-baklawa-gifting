import { createFileRoute, Link } from "@tanstack/react-router";

import { Hero } from "@/components/home/hero";
import { BusinessSplit, CraftsmanshipModule, GiftingModule } from "@/components/home/editorial";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { CategoryTile, CollectionCard } from "@/components/oasis/cards";
import { TrustStrip } from "@/components/oasis/trust-strip";
import { StoreCard } from "@/components/oasis/story-cards";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { ChannelStrip } from "@/components/oasis/channel-links";
import { ArticleCard } from "@/components/oasis/article-card";
import { articlesByDate } from "@/data/journal";
import { PartnershipModule } from "@/components/oasis/partnership-module";
import { Button } from "@/components/ui/button";
import { bestSellers, categoriesAll, collections, getProductsByCollection } from "@/data/catalog";
import { occasionGroups } from "@/data/gifting";
import { stores } from "@/data/site";

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
          intro="Shop by world — baklawa, dates, chocolate, fusion sweets, nuts and gifting."
          action={
            <Button asChild variant="outline">
              <Link to="/shop">View all products</Link>
            </Button>
          }
        />
        <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {categoriesAll.slice(0, 8).map((category) => (
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

      <section className="border-t border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Gift by occasion"
            title="Who is it for?"
            intro="Corporate, wedding, festival, family, personal and premium gifting — each with its own route into the range."
            action={
              <Button asChild variant="outline">
                <Link to="/gifting">Gifting hub</Link>
              </Button>
            }
          />
          <ul className="mt-12 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {occasionGroups.map((group) => (
              <li key={group.id} className="bg-background p-6">
                <span className="gold-rule block" aria-hidden="true" />
                <h3 className="mt-4 font-display text-xl">{group.title}</h3>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                  {group.intro}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-10">
            <Button asChild size="lg">
              <Link to="/build-a-gift">Build a gift</Link>
            </Button>
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
          intro="Oasis counters across Delhi NCR, Amritsar and Srinagar."
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

      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="The Journal"
          title="Gift guides, ingredients and stories"
          intro="Editorial notes on choosing, serving and sharing — with links straight into the range."
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
      </section>

      <ChannelStrip />

      <PartnershipModule />

      <NewsletterModule />
    </>
  );
}
