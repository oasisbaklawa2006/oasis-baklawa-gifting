import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { Chip } from "@/components/oasis/chips";
import { ProductCard } from "@/components/oasis/product-card";
import { EmptyState } from "@/components/oasis/states";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { categoriesAll as categories, dietaryOptions, occasions, products } from "@/data/catalog";
import type { Product } from "@/data/types";

type ShopSearch = { category?: string; collection?: string };

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    ...(typeof search["category"] === "string" ? { category: search["category"] } : {}),
    ...(typeof search["collection"] === "string" ? { collection: search["collection"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Shop Baklawa & Arabic Sweets — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Browse the Oasis Baklawa range: pistachio baklawa, Arabic sweets assortments and gift boxes, filtered by category, occasion and price.",
      },
      { property: "og:title", content: "Shop — Oasis Baklawa" },
      {
        property: "og:description",
        content: "The full Oasis Baklawa range, from signature baklawa to boxed gifting.",
      },
    ],
  }),
  component: ShopPage,
});

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];

const PAGE_SIZE = 18;

function priceOf(product: Product) {
  return product.variants[0]?.price.amount ?? 0;
}

function FilterPanel({
  categorySlug,
  setCategorySlug,
  maxPrice,
  setMaxPrice,
  selectedOccasions,
  toggleOccasion,
  selectedDietary,
  toggleDietary,
  inStockOnly,
  setInStockOnly,
  onReset,
}: {
  categorySlug: string | null;
  setCategorySlug: (v: string | null) => void;
  maxPrice: number;
  setMaxPrice: (v: number) => void;
  selectedOccasions: string[];
  toggleOccasion: (v: string) => void;
  selectedDietary: string[];
  toggleDietary: (v: string) => void;
  inStockOnly: boolean;
  setInStockOnly: (v: boolean) => void;
  onReset: () => void;
}) {
  return (
    <div className="space-y-10">
      <fieldset>
        <legend className="eyebrow">Category</legend>
        <ul className="mt-4 space-y-2">
          <li>
            <button
              type="button"
              onClick={() => setCategorySlug(null)}
              aria-pressed={categorySlug === null}
              className={`flex min-h-9 items-center text-[0.875rem] ${categorySlug === null ? "text-foreground" : "text-muted-foreground"}`}
            >
              All products
            </button>
          </li>
          {categories.map((category) => (
            <li key={category.id}>
              <button
                type="button"
                onClick={() => setCategorySlug(category.slug)}
                aria-pressed={categorySlug === category.slug}
                className={`flex min-h-9 items-center text-[0.875rem] ${categorySlug === category.slug ? "text-foreground" : "text-muted-foreground"}`}
              >
                {category.name}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Price up to</legend>
        <div className="mt-5">
          <Slider
            value={[maxPrice]}
            min={500}
            max={3500}
            step={50}
            onValueChange={(v) => setMaxPrice(v[0] ?? 3500)}
            aria-label="Maximum price"
          />
          <p className="mt-3 text-[0.8125rem] tabular-nums text-muted-foreground">
            ₹{maxPrice.toLocaleString("en-IN")}
          </p>
        </div>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Gifting &amp; occasion</legend>
        <ul className="mt-4 space-y-3">
          {occasions.map((occasion) => (
            <li key={occasion} className="flex items-center gap-3">
              <Checkbox
                id={`occasion-${occasion}`}
                checked={selectedOccasions.includes(occasion)}
                onCheckedChange={() => toggleOccasion(occasion)}
              />
              <Label htmlFor={`occasion-${occasion}`} className="text-[0.875rem] font-normal">
                {occasion}
              </Label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Dietary</legend>
        <p className="mt-2 text-[0.75rem] text-muted-foreground">
          Confirmed against each product’s specification where published.
        </p>
        <ul className="mt-4 space-y-3">
          {dietaryOptions.map((option) => (
            <li key={option} className="flex items-center gap-3">
              <Checkbox
                id={`dietary-${option}`}
                checked={selectedDietary.includes(option)}
                onCheckedChange={() => toggleDietary(option)}
              />
              <Label htmlFor={`dietary-${option}`} className="text-[0.875rem] font-normal">
                {option}
              </Label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset>
        <legend className="eyebrow">Availability</legend>
        <div className="mt-4 flex items-center gap-3">
          <Checkbox
            id="in-stock"
            checked={inStockOnly}
            onCheckedChange={(v) => setInStockOnly(Boolean(v))}
          />
          <Label htmlFor="in-stock" className="text-[0.875rem] font-normal">
            In stock only
          </Label>
        </div>
      </fieldset>

      <Button
        variant="ghost"
        onClick={onReset}
        className="px-0 text-[0.8125rem] underline-offset-4 hover:underline"
      >
        Reset filters
      </Button>
    </div>
  );
}

function ShopPage() {
  const search = Route.useSearch();
  const [categorySlug, setCategorySlug] = useState<string | null>(search.category ?? null);
  const [maxPrice, setMaxPrice] = useState(3500);
  const [selectedOccasions, setSelectedOccasions] = useState<string[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const results = useMemo(() => {
    const categoryId = categories.find((c) => c.slug === categorySlug)?.id;

    const filtered = products.filter((product) => {
      if (categoryId && product.categoryId !== categoryId) return false;
      if (priceOf(product) > maxPrice) return false;
      if (selectedOccasions.length && !selectedOccasions.some((o) => product.occasions.includes(o)))
        return false;
      if (selectedDietary.length && !selectedDietary.every((d) => product.dietary.includes(d)))
        return false;
      if (inStockOnly && !product.variants.some((v) => v.availability === "in-stock")) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sort === "price-asc") sorted.sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "price-desc") sorted.sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [categorySlug, maxPrice, selectedOccasions, selectedDietary, inStockOnly, sort]);

  const reset = () => {
    setCategorySlug(null);
    setMaxPrice(3500);
    setSelectedOccasions([]);
    setSelectedDietary([]);
    setInStockOnly(false);
    setVisible(PAGE_SIZE);
  };

  const panelProps = {
    categorySlug,
    setCategorySlug,
    maxPrice,
    setMaxPrice,
    selectedOccasions,
    toggleOccasion: (v: string) => toggle(selectedOccasions, setSelectedOccasions, v),
    selectedDietary,
    toggleDietary: (v: string) => toggle(selectedDietary, setSelectedDietary, v),
    inStockOnly,
    setInStockOnly,
    onReset: reset,
  };

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
        <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
          The full range, from the daily baklawa tray to Arabic dates, chocolates, fusion sweets,
          nuts and boxed gifting.
        </p>
      </section>

      <section className="container-oasis pb-20">
        <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-2 md:mx-0 md:px-0">
          <Chip active={categorySlug === null} onClick={() => setCategorySlug(null)}>
            All
          </Chip>
          {categories.map((category) => (
            <Chip
              key={category.id}
              active={categorySlug === category.slug}
              onClick={() => setCategorySlug(category.slug)}
            >
              {category.name}
            </Chip>
          ))}
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
          <aside className="hidden lg:block" aria-label="Filters">
            <FilterPanel {...panelProps} />
          </aside>

          <div className="min-w-0">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-y border-border py-3">
              <p className="min-w-0 text-[0.8125rem] text-muted-foreground" aria-live="polite">
                {results.length} {results.length === 1 ? "product" : "products"}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <Sheet>
                  <SheetTrigger className="inline-flex h-10 items-center gap-2 rounded-sm border border-border px-3 text-[0.8125rem] lg:hidden">
                    <SlidersHorizontal className="size-4" /> Filters
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="max-h-[85dvh] overflow-y-auto bg-background"
                  >
                    <SheetHeader className="text-left">
                      <SheetTitle className="font-display text-xl">Filters</SheetTitle>
                    </SheetHeader>
                    <div className="pb-8 pt-6">
                      <FilterPanel {...panelProps} />
                    </div>
                  </SheetContent>
                </Sheet>

                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger
                    className="h-10 w-[10.5rem] rounded-sm border-border"
                    aria-label="Sort products"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="mt-10">
                <EmptyState
                  title="Nothing matches those filters"
                  description="Try widening the price range or clearing a filter to see more of the range."
                  action={<Button onClick={reset}>Reset filters</Button>}
                />
              </div>
            ) : (
              <>
                <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 xl:grid-cols-3">
                  {results.slice(0, visible).map((product, i) => (
                    <ProductCard key={product.id} product={product} priority={i < 3} />
                  ))}
                </div>

                {visible < results.length ? (
                  <div className="mt-14 flex flex-col items-center gap-4">
                    <p className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                      Showing {Math.min(visible, results.length)} of {results.length}
                    </p>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                    >
                      Load more
                    </Button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
