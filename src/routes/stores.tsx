import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { Chip } from "@/components/oasis/chips";
import { StoreCard } from "@/components/oasis/story-cards";
import { EmptyState } from "@/components/oasis/states";
import { NewsletterModule } from "@/components/oasis/newsletter";
import { stores } from "@/data/site";
import { contact } from "@/data/brand";

export const Route = createFileRoute("/stores")({
  head: () => ({
    meta: [
      { title: "Stores — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Oasis Baklawa counters in Delhi NCR, Amritsar and Srinagar, with the head office and production unit at Kirti Nagar, New Delhi.",
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
        <h1 className="mt-4 max-w-2xl text-4xl leading-tight md:text-[3rem]">
          Find an Oasis counter
        </h1>
        <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted-foreground">
          Our counters across Delhi NCR, Amritsar and Srinagar, plus the head office and production
          unit at Kirti Nagar. For timings at a specific counter, call {""}
          <a href={contact.phoneHref} className="link-underline text-foreground">
            {contact.phone}
          </a>
          .
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

        <div className="mt-10 border border-border bg-utility p-8">
          <p className="eyebrow">Head office &amp; production</p>
          <p className="mt-3 text-[0.9375rem] text-muted-foreground">
            {contact.headOffice.lines.join(", ")} · {""}
            <a href={contact.emailHref} className="link-underline text-foreground">
              {contact.email}
            </a>
          </p>
        </div>
      </section>

      <NewsletterModule />
    </>
  );
}
