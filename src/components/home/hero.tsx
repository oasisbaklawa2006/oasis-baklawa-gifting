import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { brandMedia } from "@/data/brand";

export function Hero() {
  return (
    <section className="border-b border-border bg-background">
      <div className="container-oasis grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-16 lg:py-20">
        <div className="max-w-xl">
          <p className="eyebrow flex items-center gap-3">
            <span className="gold-rule inline-block" aria-hidden="true" />
            Baklawa &amp; Arabic sweets
          </p>
          <h1 className="mt-5 text-[2.25rem] leading-[1.1] sm:text-5xl lg:text-[3.5rem]">
            Layered by hand, finished with restraint
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            Fine filo, clarified butter and generous pistachio. Made in small batches and boxed with
            the care the occasion deserves.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/shop">Shop the collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/about">Discover Oasis</Link>
            </Button>
          </div>
          <dl className="mt-12 grid max-w-md grid-cols-2 gap-6 border-t border-border pt-8">
            <div>
              <dt className="eyebrow">Made</dt>
              <dd className="mt-2 text-[0.875rem] text-muted-foreground">In small daily batches</dd>
            </div>
            <div>
              <dt className="eyebrow">Presented</dt>
              <dd className="mt-2 text-[0.875rem] text-muted-foreground">
                Gift-ready across the range
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-sm bg-premium">
            <div className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
              <img
                src={brandMedia.hero.src}
                alt={brandMedia.hero.alt}
                width={1408}
                height={1600}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
          <figcaption className="mt-4 flex items-center gap-3 text-[0.75rem] uppercase tracking-[0.14em] text-driftwood">
            <span className="gold-rule inline-block" aria-hidden="true" />
            The Signature Collection
          </figcaption>
        </div>
      </div>
    </section>
  );
}
