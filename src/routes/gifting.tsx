import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { ProductCard } from "@/components/oasis/product-card";
import { SectionHeading } from "@/components/oasis/section-heading";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { collections, getProductsByCollection, images, products } from "@/data/catalog";
import { giftingServices } from "@/data/site";

export const Route = createFileRoute("/gifting")({
  head: () => ({
    meta: [
      { title: "Gifting & Gift Boxes — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Boxed baklawa and Arabic sweets for festivals, hosting and thank-yous, with presentation packaging and corporate gifting options.",
      },
      { property: "og:title", content: "Gifting — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Considered packaging and curated boxes for occasions and corporate gifting.",
      },
    ],
  }),
  component: GiftingPage,
});

function GiftingPage() {
  const giftingCollection = collections.find((c) => c.slug === "gifting");
  const giftItems = giftingCollection
    ? getProductsByCollection(giftingCollection.id)
    : products.filter((p) => p.badges.includes("gifting"));

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Gifting" }]} />
      </div>

      <section className="container-oasis mt-6">
        <div className="grid items-stretch gap-0 border border-border md:grid-cols-2">
          <div className="flex flex-col justify-center bg-premium p-8 md:p-12">
            <p className="eyebrow">Occasion-led</p>
            <h1 className="mt-3 text-3xl leading-tight md:text-[3rem]">
              Gifting, considered end to end
            </h1>
            <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
              Boxes sized for festivals, hosting and thank-yous — packed to arrive in the same
              condition they left the kitchen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/shop" search={{ collection: "col-gifting" }}>
                  Shop gift boxes
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/business">Corporate gifting</Link>
              </Button>
            </div>
          </div>
          <img
            src={images.giftBox}
            alt="Sand-coloured Oasis Baklawa gift box finished with a ribbon"
            width={1400}
            height={1200}
            decoding="async"
            className="aspect-[4/3] size-full object-cover md:aspect-auto"
          />
        </div>
      </section>

      <section className="container-oasis mt-16 md:mt-24">
        <SectionHeading
          eyebrow="What we can do"
          title="Gifting services"
          intro="Options available across the range. Details are confirmed per order."
        />
        <ul className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {giftingServices.map((service) => (
            <li key={service.title} className="bg-background p-6">
              <span className="gold-rule block" aria-hidden="true" />
              <h3 className="mt-4 font-display text-lg">{service.title}</h3>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-muted-foreground">
                {service.detail}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-oasis mt-16 md:mt-24">
        <SectionHeading
          eyebrow="Ready to send"
          title="Boxes & hampers"
          action={
            <Button variant="outline" asChild>
              <Link to="/shop">Shop everything</Link>
            </Button>
          }
        />
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
          {giftItems.slice(0, 8).map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      </section>

      <div className="mt-20">
        <NewsletterModule />
      </div>
    </div>
  );
}
