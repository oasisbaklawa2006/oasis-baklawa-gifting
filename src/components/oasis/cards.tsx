import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Category, Collection } from "@/data/types";

export function CategoryTile({ category, className }: { category: Category; className?: string }) {
  return (
    <Link
      to="/shop"
      search={{ category: category.slug }}
      className={cn("group block focus-visible:outline-offset-4", className)}
    >
      <div className="overflow-hidden rounded-sm bg-premium">
        <div className="aspect-[3/4]">
          <img
            src={category.image.src}
            alt={category.image.alt}
            width={1200}
            height={1600}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-xl">{category.name}</h3>
          <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {category.description}
          </p>
        </div>
        <ArrowUpRight className="mt-1 size-4 shrink-0 text-driftwood transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function CollectionCard({
  collection,
  className,
  ratio = "aspect-[16/11]",
}: {
  collection: Collection;
  className?: string;
  ratio?: string;
}) {
  return (
    <Link
      to="/shop"
      search={{ collection: collection.slug }}
      className={cn("group block focus-visible:outline-offset-4", className)}
    >
      <div className="overflow-hidden rounded-sm bg-premium">
        <div className={ratio}>
          <img
            src={collection.image.src}
            alt={collection.image.alt}
            width={1400}
            height={960}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <p className="eyebrow mt-4">{collection.kicker}</p>
      <h3 className="mt-2 font-display text-2xl">{collection.name}</h3>
      <p className="mt-2 max-w-md text-[0.875rem] leading-relaxed text-muted-foreground">
        {collection.description}
      </p>
      <span className="link-underline mt-4 inline-block text-[0.8125rem] uppercase tracking-[0.14em] text-earth">
        Explore
      </span>
    </Link>
  );
}
