import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { CatalogBrowser, CategoryHero } from "@/components/oasis/catalog-browser";
import { SectionHeading } from "@/components/oasis/section-heading";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { departmentById } from "@/data/departments";
import { brandMedia, productMedia } from "@/data/brand";
import {
  categoriesOfDepartment,
  productsOfDepartment,
  validateCatalogSearch,
  type CatalogSearch,
} from "@/lib/catalog-filter";

const department = departmentById("luxury-gifts");

export const Route = createFileRoute("/luxury-gifts")({
  validateSearch: validateCatalogSearch,
  head: () => ({
    meta: [
      { title: "Luxury Gifts — Oasis Baklawa Gift Boxes, Chests & Hampers" },
      {
        name: "description",
        content:
          "Oasis luxury gifting: presentation chests, boxed assortments and hampers for festive, wedding, baby shower, casual and corporate gifting.",
      },
      { property: "og:title", content: "Luxury Gifts — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Presentation chests, boxed assortments and hampers from Oasis Baklawa.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: brandMedia.giftBanner.src },
      { name: "twitter:image", content: brandMedia.giftBanner.src },
    ],
  }),
  component: LuxuryGiftsPage,
});

const featured = [
  {
    title: "Presentation chests",
    body: "Twenty-five compartment chests for weddings, milestones and senior client gifting.",
    image: productMedia["rosello-25"]!,
    search: { giftType: "premium-gifting" },
  },
  {
    title: "Boxed assortments",
    body: "Mixed selections across baklawa, chocolate and confections, boxed for handing over.",
    image: productMedia["pure-bliss"]!,
    search: { giftType: "assortment-gifts" },
  },
];

function LuxuryGiftsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const onChange = (patch: CatalogSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  return (
    <>
      <CategoryHero
        eyebrow={department.eyebrow}
        title={department.title}
        intro={department.intro}
        image={department.hero}
      />

      <div className="container-oasis pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Luxury Gifts" }]} />
      </div>

      <section className="container-oasis pt-10">
        <div className="grid gap-x-6 gap-y-10 md:grid-cols-2">
          {featured.map((card) => (
            <Link
              key={card.title}
              to="/luxury-gifts"
              search={card.search}
              className="group block focus-visible:outline-offset-4"
            >
              <div className="overflow-hidden rounded-sm bg-premium">
                <div className="aspect-[16/11]">
                  <img
                    src={card.image.src}
                    alt={card.image.alt}
                    width={1400}
                    height={960}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                  />
                </div>
              </div>
              <h2 className="mt-5 font-display text-2xl">{card.title}</h2>
              <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-muted-foreground">
                {card.body}
              </p>
              <span className="link-underline mt-4 inline-block text-[0.8125rem] uppercase tracking-[0.14em] text-earth">
                Explore
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-oasis section-y">
        <CatalogBrowser
          products={productsOfDepartment("luxury-gifts")}
          categories={categoriesOfDepartment("luxury-gifts")}
          search={search}
          onChange={onChange}
        />
      </section>

      <section className="border-y border-border bg-premium">
        <div className="container-oasis section-y">
          <SectionHeading
            eyebrow="Gifting service"
            title="Told what you need, we arrange the rest"
            intro="Presentation packaging across the range, message cards on request, and coordinated dispatch for larger gifting. Volume and customisation are confirmed on enquiry."
            action={
              <Button asChild variant="outline">
                <Link to="/corporate">Corporate gifting</Link>
              </Button>
            }
          />
          <div className="mt-10 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/gift-finder">Gift finder</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/build-your-box">Build your own box</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/wedding-gifting">Wedding gifting</Link>
            </Button>
          </div>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
