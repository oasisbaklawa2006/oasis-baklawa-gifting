import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Input } from "@/components/ui/input";
import type { CoreCatalogueProduct } from "@/lib/catalogue/core-connect2.server";

/**
 * This is deliberately not a ProductCard. CONNECT-2 catalogue.products has no
 * approved consumer price, live stock, slug or checkout contract. In particular,
 * never join these records with fixture products by SKU or name.
 */
function safeProductImage(urlText?: string): string | undefined {
  if (!urlText) return undefined;
  try {
    const url = new URL(urlText);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const PAGE_SIZE = 18;

export function GovernedShopBrowse({ products }: { products: CoreCatalogueProduct[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const categories = useMemo(
    () =>
      [...new Set(products.map((item) => item.category?.trim()).filter((value): value is string => Boolean(value)))]
        .sort((a, b) => a.localeCompare(b)),
    [products],
  );
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return products
      .filter(
        (item) =>
          (category === "all" || item.category === category) &&
          (!term ||
            [item.name, item.sku, item.shortDescription, item.category]
              .filter(Boolean)
              .some((field) => field!.toLocaleLowerCase().includes(term))),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query, category]);

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Shop" }]} />
      </div>
      <section className="container-oasis pb-10 pt-8">
        <p className="eyebrow flex items-center gap-3">
          <span className="gold-rule inline-block" aria-hidden="true" />
          The range
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight md:text-[3rem]">
          Baklawa, Arabic sweets and gifting
        </h1>
        <p className="mt-5 max-w-2xl text-[0.9375rem] leading-relaxed text-muted-foreground">
          Product information supplied by the Oasis Core catalogue.
        </p>
        <p role="status" className="mt-6 rounded-sm border border-border bg-premium px-5 py-4 text-sm leading-relaxed text-muted-foreground">
          Browse-only catalogue. Prices, availability and delivery promises are not
          verified retail offers. Online ordering remains unavailable until Core
          checkout and payments are independently certified.
        </p>
      </section>

      <section className="container-oasis pb-20" aria-label="Oasis Core catalogue">
        <div className="max-w-lg">
          <label htmlFor="core-catalogue-search" className="eyebrow">
            Search products
          </label>
          <Input
            id="core-catalogue-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search product name or category"
            className="mt-3 h-11"
          />
        </div>

        {categories.length ? (
          <div className="mt-7 flex flex-wrap gap-2" aria-label="Filter catalogue by category">
            <button
              type="button"
              aria-pressed={category === "all"}
              onClick={() => { setCategory("all"); setVisible(PAGE_SIZE); }}
              className="min-h-9 rounded-sm border border-border px-4 text-sm aria-pressed:bg-premium"
            >
              All products
            </button>
            {categories.map((name) => (
              <button
                type="button"
                key={name}
                aria-pressed={category === name}
                onClick={() => { setCategory(name); setVisible(PAGE_SIZE); }}
                className="min-h-9 rounded-sm border border-border px-4 text-sm aria-pressed:bg-premium"
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}

        <p className="mt-8 border-b border-border pb-4 text-sm text-muted-foreground" aria-live="polite">
          {results.length} {results.length === 1 ? "product" : "products"}
        </p>
        {results.length ? (
          <>
            <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
              {results.slice(0, visible).map((item) => {
                const imageUrl = safeProductImage(item.heroImageUrl);
                return (
                  <article key={item.productId} className="min-w-0">
                    <div className="aspect-square overflow-hidden rounded-sm bg-premium">
                      {imageUrl ? (
                        <img
                          alt={item.name}
                          src={imageUrl}
                          className="size-full object-cover"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center px-5 text-center font-display text-xl text-muted-foreground">
                          Oasis Baklawa
                        </div>
                      )}
                    </div>
                    {item.category ? (
                      <p className="eyebrow mt-4 text-driftwood">{item.category}</p>
                    ) : null}
                    <h2 className="mt-2 font-display text-xl leading-snug">{item.name}</h2>
                    {item.shortDescription ? (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {item.shortDescription}
                      </p>
                    ) : null}
                    {item.packSize ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Pack information: {item.packSize} {item.primaryUom ?? ""}
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
            {visible < results.length ? (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  className="min-h-11 rounded-sm border border-border px-6 text-sm"
                  onClick={() => setVisible((current) => current + PAGE_SIZE)}
                >
                  Load more
                </button>
              </div>
            ) : null}
          </>
        ) : (
          <p className="mt-10 text-muted-foreground">
            No products match this search. Try another product name or category.
          </p>
        )}
        <p className="mt-10 text-sm text-muted-foreground">
          For product specifications and purchase enquiries, please{" "}
          <Link to="/contact" className="underline underline-offset-4">
            contact our team
          </Link>.
        </p>
      </section>
      <NewsletterModule />
    </>
  );
}
