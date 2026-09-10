import { createFileRoute, Link } from "@tanstack/react-router";

import { Hero } from "@/components/home/hero";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { CollectionCard } from "@/components/oasis/cards";
import { TrustStrip } from "@/components/oasis/trust-strip";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { ArticleCard } from "@/components/oasis/article-card";
import { Button } from "@/components/ui/button";
import { articlesByDate } from "@/data/journal";
import { brand, brandMedia, brandStory } from "@/data/brand";
import { bestSellers, collections, getProductsByCollection } from "@/data/catalog";
import { homeEntrances } from "@/data/departments";
import { toLink } from "@/lib/routes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Oasis Baklawa — Baklawa, Arabic Sweets & Luxury Gifting" },
      {
        name: "description",
        content:
          "Baklawa, Arabic dates, chocolates and luxury gifting from Oasis Baklawa, made at our own unit in Kirti Nagar, New Delhi. Shop gifts by occasion or build your own box.",
      },
      { property: "og:title", content: "Oasis Baklawa — Baklawa & Luxury Gifting" },
      {
        property: "og:description",
        content: "Baklawa and Arabic sweets made in small batches and boxed for gifting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: brandMedia.hero.src },
      { name: "twitter:image", content: brandMedia.hero.src },
    ],
  }),
  component: HomePage,
});

const giftShortcuts = [
  { label: "Festive", to: "/luxury-gifts?occasion=Festive" },
  { label: "Wedding & mehendi", to: "/wedding-gifting" },
  { label: "Corporate", to: "/corporate" },
  { label: "Family & friends", to: "/luxury-gifts?recipient=family-friends" },
  { label: "Host / thank you", to: "/luxury-gifts?recipient=host-thank-you" },
  { label: "Not sure yet", to: "/gift-finder" },
];

function HomePage() {
  const newArrivals = getProductsByCollection("col-seasonal").slice(0, 4);

  return (
    <>
      <Hero />

      {/* Two featured editorial collections */}
      <section className="container-oasis section-y">
        <div className="grid gap-x-6 gap-y-12 md:grid-cols-2">
          {collections.slice(0, 2).map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      {/* Best sellers */}
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

      {/* Find your perfect gift */}
      <section className="border-t border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Find your perfect gift"
            title="Start with the occasion"
            intro="Tell us who it is for and we will narrow the range to the formats that suit."
            action={
              <Button asChild variant="outline">
                <Link to="/luxury-gifts">All luxury gifts</Link>
              </Button>
            }
          />
          <ul className="mt-10 flex flex-wrap gap-3">
            {giftShortcuts.map((shortcut) => (
              <li key={shortcut.label}>
                <Link
                  {...toLink(shortcut.to)}
                  className="inline-flex min-h-11 items-center rounded-sm border border-border bg-background px-5 text-[0.8125rem] uppercase tracking-[0.12em] text-foreground transition-colors hover:border-gold"
                >
                  {shortcut.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Shop by category — six entrances only */}
      <section className="container-oasis section-y">
        <SectionHeading eyebrow="Shop by category" title="Six ways into the range" />
        <ul className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
          {homeEntrances.map((entrance) => (
            <li key={entrance.label}>
              <Link {...toLink(entrance.to)} className="group block">
                <div className="overflow-hidden rounded-sm bg-premium">
                  <div className="aspect-[4/3]">
                    <img
                      src={entrance.image.src}
                      alt={entrance.image.alt}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <h3 className="mt-4 font-display text-lg">{entrance.label}</h3>
                <p className="mt-1 text-[0.8125rem] text-muted-foreground">{entrance.note}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* New arrivals */}
      {newArrivals.length > 0 ? (
        <section className="border-t border-border bg-utility">
          <div className="container-oasis section-y">
            <SectionHeading
              eyebrow="What’s new"
              title="Recent additions and seasonal runs"
              action={
                <Button asChild variant="outline">
                  <Link to="/gourmet-food" search={{ collection: "col-seasonal" }}>
                    View all
                  </Link>
                </Button>
              }
            />
            <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Editorial story */}
      <section className="border-t border-border">
        <div className="container-oasis section-y grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden rounded-sm bg-premium">
            <div className="aspect-[4/3]">
              <img
                src={brandMedia.craft.src}
                alt={brandMedia.craft.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
          <div className="max-w-xl">
            <p className="eyebrow">The art of baklawa</p>
            <h2 className="mt-4 text-3xl leading-tight md:text-[2.5rem]">
              Layered by hand, finished with restraint
            </h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Sheets of filo laid thin, brushed with clarified butter and layered before the nuts go
              in. Small batches, boxed the way the occasion deserves.
            </p>
            <Button asChild variant="outline" className="mt-8">
              <Link to="/baklawa">Shop baklawa</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Production story */}
      <section className="border-t border-border bg-premium">
        <div className="container-oasis section-y grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="max-w-xl">
            <p className="eyebrow">Kirti Nagar, New Delhi</p>
            <h2 className="mt-4 text-3xl leading-tight md:text-[2.5rem]">Made at our own unit</h2>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              Quality, innovation, packaging, distribution and customer experience sit under one
              roof at our production unit in Kirti Nagar, New Delhi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link to="/business">Our production</Link>
              </Button>
              <Button asChild variant="ghost" className="px-0">
                <Link to="/stores">Find a store</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-sm bg-background lg:order-first">
            <div className="aspect-[4/3]">
              <img
                src={brandMedia.factory.src}
                alt={brandMedia.factory.alt}
                loading="lazy"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <TrustStrip />

      {/* Brand stories */}
      <section className="container-oasis section-y">
        <SectionHeading
          eyebrow="World of Oasis"
          title={brand.positioning}
          action={
            <Button asChild variant="outline">
              <Link to="/world-of-oasis">World of Oasis</Link>
            </Button>
          }
        />
        <ul className="mt-12 grid gap-x-8 gap-y-10 md:grid-cols-3">
          {brandStory.slice(0, 3).map((chapter) => (
            <li key={chapter.title} className="border-t border-border pt-5">
              <h3 className="font-display text-xl">{chapter.title}</h3>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {chapter.body}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Journal */}
      <section className="container-oasis pb-20">
        <SectionHeading
          eyebrow="The Journal"
          title="Gift guides, ingredients and stories"
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

      <NewsletterModule />
    </>
  );
}
