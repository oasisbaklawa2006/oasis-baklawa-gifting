import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { CatalogBrowser, CategoryHero } from "@/components/oasis/catalog-browser";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { brandMedia } from "@/data/brand";
import { departmentById } from "@/data/departments";
import {
  categoriesOfDepartment,
  productsOfDepartment,
  validateCatalogSearch,
  type CatalogSearch,
} from "@/lib/catalog-filter";

const department = departmentById("gourmet-food");

export const Route = createFileRoute("/gourmet-food")({
  validateSearch: validateCatalogSearch,
  head: () => ({
    meta: [
      { title: "Gourmet Food — Arabic Dates, Chocolates & Sweets | Oasis Baklawa" },
      {
        name: "description",
        content:
          "Arabic dates and chocodates, house chocolates, fusion sweets, Turkish delight and nut selections from the Oasis Baklawa kitchen.",
      },
      { property: "og:title", content: "Gourmet Food — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Arabic dates, chocolates, fusion sweets, Turkish delight and nut selections.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: brandMedia.chocolateBanner.src },
      { name: "twitter:image", content: brandMedia.chocolateBanner.src },
    ],
  }),
  component: GourmetFoodPage,
});

function GourmetFoodPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const onChange = (patch: CatalogSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const categories = categoriesOfDepartment("gourmet-food");
  const products = productsOfDepartment("gourmet-food");
  const highlights = products.filter((p) => p.badges.includes("bestseller")).slice(0, 4);

  return (
    <>
      <CategoryHero
        eyebrow={department.eyebrow}
        title={department.title}
        intro={department.intro}
        image={department.hero}
      />

      <div className="container-oasis pt-6">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Gourmet Food" }]} />
      </div>

      <section className="container-oasis pt-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              to="/gourmet-food"
              search={{ category: category.slug }}
              className="group block focus-visible:outline-offset-4"
            >
              <div className="overflow-hidden rounded-sm bg-premium">
                <div className="aspect-[4/5]">
                  <img
                    src={category.image.src}
                    alt={category.image.alt}
                    width={1000}
                    height={1250}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
              </div>
              <h2 className="mt-4 font-display text-lg">{category.name}</h2>
            </Link>
          ))}
        </div>
      </section>

      {highlights.length > 0 ? (
        <section className="container-oasis section-y">
          <SectionHeading eyebrow="Best sellers" title="What leaves the counter first" />
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {highlights.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="container-oasis pb-20">
        <CatalogBrowser
          products={products}
          categories={categories}
          search={search}
          onChange={onChange}
          showGiftFacets={false}
          columns={4}
        />
      </section>

      <NewsletterModule />
    </>
  );
}
