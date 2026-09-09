import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { SectionHeading } from "@/components/oasis/section-heading";
import { ProductCard } from "@/components/oasis/product-card";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import {
  BUDGETS,
  OCCASIONS,
  PREFERENCES,
  RECIPIENTS,
  briefFromSearch,
  recommendGifts,
  type GiftBrief,
} from "@/lib/gift-finder";
import { cn } from "@/lib/utils";

const DESCRIPTION =
  "Answer four short questions — occasion, recipient, budget and taste — and see the Oasis Baklawa gifts that suit best.";

export const Route = createFileRoute("/gift-finder")({
  validateSearch: (search: Record<string, unknown>): GiftBrief => briefFromSearch(search),
  head: () => ({
    meta: [
      { title: "Gift Finder — Find the Right Gift | Oasis Baklawa" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Gift Finder — Oasis Baklawa" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GiftFinderPage,
});

function Choice({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "min-h-11 border px-4 py-2 text-[0.875rem] transition-colors",
        selected ? "border-foreground bg-premium" : "border-border hover:border-driftwood",
      )}
    >
      {label}
    </button>
  );
}

function GiftFinderPage() {
  const brief = Route.useSearch();
  const navigate = useNavigate({ from: "/gift-finder" });

  const answered = Object.keys(brief).length;
  const results = answered > 0 ? recommendGifts(brief, 6) : [];

  function set<K extends keyof GiftBrief>(key: K, value: GiftBrief[K]) {
    const next: GiftBrief = { ...brief };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    track({ name: "gift_finder_step", params: { step: String(key), value: String(value ?? "") } });
    void navigate({ search: next, replace: true });
  }

  return (
    <div className="pb-20">
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Gift finder" }]} />
      </div>

      <section className="container-oasis mt-6">
        <SectionHeading
          as="h1"
          eyebrow="Gift finder"
          title="Find the right gift in four answers"
          intro="Tell us the occasion, who it is for, roughly what you would like to spend and the taste you have in mind. Your answers stay in the page address, so you can share the shortlist with anyone."
        />
      </section>

      <section className="container-oasis mt-12 space-y-8">
        <fieldset>
          <legend className="eyebrow">1. Occasion</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {OCCASIONS.map((option) => (
              <Choice
                key={option.key}
                label={option.label}
                selected={brief.occasion === option.key}
                onSelect={() => set("occasion", option.key)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow">2. Who is it for?</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {RECIPIENTS.map((option) => (
              <Choice
                key={option.key}
                label={option.label}
                selected={brief.recipient === option.key}
                onSelect={() => set("recipient", option.key)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow">3. Budget</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {BUDGETS.map((option) => (
              <Choice
                key={option.key}
                label={option.label}
                selected={brief.budget === option.key}
                onSelect={() => set("budget", option.key)}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="eyebrow">4. Taste</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PREFERENCES.map((option) => (
              <Choice
                key={option.key}
                label={option.label}
                selected={brief.preference === option.key}
                onSelect={() => set("preference", option.key)}
              />
            ))}
          </div>
        </fieldset>
      </section>

      <section className="container-oasis mt-14" aria-live="polite">
        {answered === 0 ? (
          <p className="text-[0.9375rem] text-muted-foreground">
            Choose at least one answer above to see suggestions.
          </p>
        ) : results.length === 0 ? (
          <EmptyState
            title="Nothing matches that combination yet"
            description="Try a wider budget or a different taste, or browse the full gifting range."
            action={
              <Button asChild>
                <Link to="/gifting">Browse gifting</Link>
              </Button>
            }
          />
        ) : (
          <>
            <h2 className="font-display text-2xl">Suggested for you</h2>
            <div className="mt-6 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {results.map(({ product }) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link to="/build-a-gift">Build your own box instead</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/gifting">See all gifting</Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
