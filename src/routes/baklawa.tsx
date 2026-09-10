import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { CatalogBrowser, CategoryHero } from "@/components/oasis/catalog-browser";
import { EditorialModule } from "@/components/home/editorial";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { brandMedia, familyMedia } from "@/data/brand";
import { departmentById } from "@/data/departments";
import {
  categoriesOfDepartment,
  productsOfDepartment,
  validateCatalogSearch,
  type CatalogSearch,
} from "@/lib/catalog-filter";

const department = departmentById("baklawa");

export const Route = createFileRoute("/baklawa")({
  validateSearch: validateCatalogSearch,
  head: () => ({
    meta: [
      { title: "Baklawa — Premium & Kadayif Baklawa by Oasis Baklawa" },
      {
        name: "description",
        content:
          "Premium baklawa, kadayif shapes and boxed baklawa selections, layered by hand and made at the Oasis unit in Kirti Nagar, New Delhi.",
      },
      { property: "og:title", content: "Baklawa — Oasis Baklawa" },
      {
        property: "og:description",
        content: "Premium baklawa, kadayif shapes and boxed baklawa selections from Oasis.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: familyMedia.baklawa.src },
      { name: "twitter:image", content: familyMedia.baklawa.src },
    ],
  }),
  component: BaklawaPage,
});

function BaklawaPage() {
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
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Baklawa" }]} />
      </div>

      <section className="container-oasis section-y">
        <CatalogBrowser
          products={productsOfDepartment("baklawa")}
          categories={categoriesOfDepartment("baklawa")}
          search={search}
          onChange={onChange}
          columns={4}
        />
      </section>

      <div className="border-t border-border bg-premium">
        <EditorialModule
          eyebrow="The art of baklawa"
          title="Pastry, butter, nuts, syrup — and patience"
          body="Baklawa began at Oasis as an import from a well-known Dubai patisserie, shown in India on two table setups. Demand outgrew what could be brought in, so production moved here and an in-house research team began developing products exclusive to Oasis."
          points={[
            "Layered by hand in small batches",
            "Made at our own unit in Kirti Nagar, New Delhi",
            "Packed in rigid boxes with inner trays",
          ]}
          image={brandMedia.craft.src}
          imageAlt={brandMedia.craft.alt}
          cta={{ label: "World of Oasis", to: "/world-of-oasis" }}
        />
      </div>

      <section className="container-oasis section-y">
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/luxury-gifts" search={{ giftType: "baklawa-gift-boxes" }}>
              Baklawa gift boxes
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/gourmet-food">Gourmet food</Link>
          </Button>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
