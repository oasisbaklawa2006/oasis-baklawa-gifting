import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search as SearchIcon } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { Chip } from "@/components/oasis/chips";
import { ProductCard } from "@/components/oasis/product-card";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { categories, products } from "@/data/catalog";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search — Oasis Baklawa" },
      {
        name: "description",
        content: "Search the Oasis Baklawa range by product name, category or gifting occasion.",
      },
      { property: "og:title", content: "Search — Oasis Baklawa" },
      { property: "og:description", content: "Search baklawa, Arabic sweets and gift boxes." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();

  const results = term
    ? products.filter((product) =>
        [product.name, product.categoryCue, product.shortDescription, ...product.occasions]
          .join(" ")
          .toLowerCase()
          .includes(term),
      )
    : [];

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Search" }]} />
      </div>

      <section className="container-oasis pb-10 pt-8">
        <h1 className="text-4xl leading-tight md:text-[3rem]">Search</h1>
        <form
          role="search"
          onSubmit={(e) => e.preventDefault()}
          className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Label htmlFor="search-input" className="sr-only">
              Search products
            </Label>
            <SearchIcon
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-driftwood"
              aria-hidden="true"
            />
            <Input
              id="search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try “pistachio”, “gift box”, “assortment”"
              className="h-12 rounded-sm border-border bg-background pl-11"
            />
          </div>
          <Button type="submit" size="lg">
            Search
          </Button>
        </form>

        <div className="mt-8">
          <p className="eyebrow">Suggested categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Chip key={category.id} onClick={() => setQuery(category.name)}>
                {category.name}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      <section className="container-oasis pb-24">
        {!term ? (
          <EmptyState
            title="Start typing to search"
            description="Search across product names, categories and gifting occasions."
            action={
              <Button asChild variant="outline">
                <Link to="/shop">Browse the range</Link>
              </Button>
            }
          />
        ) : results.length === 0 ? (
          <EmptyState
            title={`No results for “${query}”`}
            description="Check the spelling, try a broader term, or browse the full range."
            action={
              <Button asChild>
                <Link to="/shop">Browse the range</Link>
              </Button>
            }
          />
        ) : (
          <>
            <p className="border-b border-border pb-3 text-[0.8125rem] text-muted-foreground" aria-live="polite">
              {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
            </p>
            <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
