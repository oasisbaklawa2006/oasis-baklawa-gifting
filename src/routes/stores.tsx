import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { Chip } from "@/components/oasis/chips";
import { StoreCard } from "@/components/oasis/story-cards";
import { EmptyState } from "@/components/oasis/states";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { stores } from "@/data/site";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Stores — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Find Oasis Baklawa stores and counters. Addresses, opening hours and services — store details are placeholders in this build.",
      },
      { property: "og:title", content: "Stores — Oasis Baklawa" },
      { property: "og:description", content: "Oasis Baklawa store locations and services." },
    ],
  }),
  component: StoresPage,
});

function StoresPage() {
  const [city, setCity] = useState<string | null>(null);
  const cities = useMemo(() => Array.from(new Set(stores.map((s) => s.city))), []);
  const results = city ? stores.filter((s) => s.city === city) : stores;

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Stores" }]} />
      </div>

      <section className="container-oasis pb-10 pt-8">
        <p className="eyebrow flex items-center gap-3">
          <span className="gold-rule inline-block" aria-hidden="true" />
          Store discovery
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight md:text-[3rem]">Find an Oasis counter</h1>
        <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
          Locations, hours and contact numbers are placeholders in this build. A map view will be added
          once addresses are confirmed.
        </p>
      </section>

      <section className="container-oasis pb-20">
        <div className="flex flex-wrap gap-2">
          <Chip active={city === null} onClick={() => setCity(null)}>
            All locations
          </Chip>
          {cities.map((name, i) => (
            <Chip key={`${name}-${i}`} active={city === name} onClick={() => setCity(name)}>
              {name}
            </Chip>
          ))}
        </div>

        <div className="mt-10">
          {results.length === 0 ? (
            <EmptyState
              title="No stores in this location yet"
              description="Try another location, or check back as the store list is confirmed."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {results.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 border border-dashed border-border bg-utility p-10 text-center">
          <p className="eyebrow">Map</p>
          <p className="mt-3 text-[0.875rem] text-muted-foreground">
            Map integration is intentionally not included in this build.
          </p>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
