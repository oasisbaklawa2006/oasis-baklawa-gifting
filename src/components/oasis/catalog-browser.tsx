import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import { ProductCard } from "@/components/oasis/product-card";
import { EmptyState } from "@/components/oasis/states";
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
import {
  availableGiftTypes,
  availableIngredients,
  availableOccasions,
  availableRecipients,
  filterProducts,
  priceCeiling,
  sortOptions,
  type CatalogSearch,
} from "@/lib/catalog-filter";
import type { Category, Product } from "@/data/types";

const INITIAL = 18;
const STEP = 12;

type Props = {
  products: Product[];
  categories: Category[];
  search: CatalogSearch;
  onChange: (patch: CatalogSearch) => void;
  /** Hide the gifting-specific facets on food-led departments. */
  showGiftFacets?: boolean;
  columns?: 3 | 4;
};

function FacetGroup({
  legend,
  options,
  value,
  onSelect,
  idPrefix,
}: {
  legend: string;
  options: { id: string; label: string }[];
  value: string | undefined;
  onSelect: (next: string | undefined) => void;
  idPrefix: string;
}) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="eyebrow">{legend}</legend>
      <ul className="mt-4 space-y-3">
        {options.map((option) => (
          <li key={option.id} className="flex items-center gap-3">
            <Checkbox
              id={`${idPrefix}-${option.id}`}
              checked={value === option.id}
              onCheckedChange={() => onSelect(value === option.id ? undefined : option.id)}
            />
            <Label
              htmlFor={`${idPrefix}-${option.id}`}
              className="text-[0.875rem] font-normal leading-snug"
            >
              {option.label}
            </Label>
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

export function CatalogBrowser({
  products,
  categories,
  search,
  onChange,
  showGiftFacets = true,
  columns = 3,
}: Props) {
  const results = useMemo(() => filterProducts(products, search), [products, search]);
  const ceiling = useMemo(() => priceCeiling(products), [products]);
  const occasions = useMemo(() => availableOccasions(products), [products]);
  const recipients = useMemo(() => availableRecipients(products), [products]);
  const giftTypes = useMemo(() => availableGiftTypes(products), [products]);
  const ingredients = useMemo(() => availableIngredients(products), [products]);

  const signature = JSON.stringify(search);
  const [visible, setVisible] = useState(INITIAL);
  useEffect(() => setVisible(INITIAL), [signature]);

  const reset = () =>
    onChange({
      category: undefined,
      collection: undefined,
      occasion: undefined,
      recipient: undefined,
      giftType: undefined,
      ingredient: undefined,
      maxPrice: undefined,
    });

  const panel = (
    <div className="space-y-10">
      {categories.length > 1 ? (
        <fieldset>
          <legend className="eyebrow">Category</legend>
          <ul className="mt-4 space-y-2">
            <li>
              <button
                type="button"
                onClick={() => onChange({ category: undefined })}
                aria-pressed={!search.category}
                className={`flex min-h-9 items-center text-[0.875rem] ${!search.category ? "text-foreground" : "text-muted-foreground"}`}
              >
                All
              </button>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      category: search.category === category.slug ? undefined : category.slug,
                    })
                  }
                  aria-pressed={search.category === category.slug}
                  className={`flex min-h-9 items-center text-left text-[0.875rem] ${search.category === category.slug ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <FacetGroup
        legend="Occasion"
        idPrefix="occasion"
        options={occasions.map((o) => ({ id: o, label: o }))}
        value={search.occasion}
        onSelect={(occasion) => onChange({ occasion })}
      />

      {showGiftFacets ? (
        <>
          <FacetGroup
            legend="Recipient"
            idPrefix="recipient"
            options={recipients.map((r) => ({ id: r.id, label: r.label }))}
            value={search.recipient}
            onSelect={(recipient) => onChange({ recipient })}
          />
          <FacetGroup
            legend="Gift type"
            idPrefix="gift-type"
            options={giftTypes.map((g) => ({ id: g.id, label: g.label }))}
            value={search.giftType}
            onSelect={(giftType) => onChange({ giftType })}
          />
        </>
      ) : null}

      <FacetGroup
        legend="Ingredient"
        idPrefix="ingredient"
        options={ingredients.map((i) => ({ id: i, label: i }))}
        value={search.ingredient}
        onSelect={(ingredient) => onChange({ ingredient })}
      />

      <fieldset>
        <legend className="eyebrow">Price up to</legend>
        <div className="mt-5">
          <Slider
            value={[search.maxPrice ?? ceiling]}
            min={250}
            max={ceiling}
            step={50}
            onValueChange={(v) => onChange({ maxPrice: v[0] ?? ceiling })}
            aria-label="Maximum price"
          />
          <p className="mt-3 text-[0.8125rem] tabular-nums text-muted-foreground">
            ₹{(search.maxPrice ?? ceiling).toLocaleString("en-IN")}
          </p>
        </div>
      </fieldset>

      <Button
        variant="ghost"
        onClick={reset}
        className="px-0 text-[0.8125rem] underline-offset-4 hover:underline"
      >
        Clear all filters
      </Button>
    </div>
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
      <aside className="hidden lg:block" aria-label="Filters">
        {panel}
      </aside>

      <div className="min-w-0">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-y border-border py-3">
          <p className="min-w-0 text-[0.8125rem] text-muted-foreground" aria-live="polite">
            {results.length} {results.length === 1 ? "product" : "products"}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <Sheet>
              <SheetTrigger className="inline-flex h-11 items-center gap-2 rounded-sm border border-border px-3 text-[0.8125rem] lg:hidden">
                <SlidersHorizontal className="size-4" /> Filters
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto bg-background">
                <SheetHeader className="text-left">
                  <SheetTitle className="font-display text-xl">Filters</SheetTitle>
                </SheetHeader>
                <div className="pb-8 pt-6">{panel}</div>
              </SheetContent>
            </Sheet>

            <Select value={search.sort ?? "featured"} onValueChange={(sort) => onChange({ sort })}>
              <SelectTrigger
                className="h-11 w-[10.5rem] rounded-sm border-border"
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
              description="Clear a filter or widen the price to see more of the range."
              action={<Button onClick={reset}>Clear all filters</Button>}
            />
          </div>
        ) : (
          <>
            <div
              className={`mt-10 grid grid-cols-2 gap-x-5 gap-y-12 ${columns === 4 ? "lg:grid-cols-3 xl:grid-cols-4" : "xl:grid-cols-3"}`}
            >
              {results.slice(0, visible).map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 3} />
              ))}
            </div>

            {visible < results.length ? (
              <div className="mt-14 flex flex-col items-center gap-4">
                <p className="text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
                  Showing {Math.min(visible, results.length)} of {results.length}
                </p>
                <Button variant="outline" size="lg" onClick={() => setVisible((v) => v + STEP)}>
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/** Shared banner used at the top of every department / list page. */
export function CategoryHero({
  eyebrow,
  title,
  intro,
  image,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  image: { src: string; alt: string };
}) {
  return (
    <section className="border-b border-border bg-premium">
      <div className="container-oasis grid items-center gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:py-16">
        <div className="max-w-xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            {eyebrow}
          </p>
          <h1 className="mt-5 text-[2.125rem] leading-[1.12] sm:text-5xl">{title}</h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>
        </div>
        <div className="overflow-hidden rounded-sm bg-background">
          <div className="aspect-[16/10]">
            <img
              src={image.src}
              alt={image.alt}
              width={1600}
              height={1000}
              fetchPriority="high"
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
