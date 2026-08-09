import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

import { useShop } from "@/lib/store";

import { BrandBadge } from "./chips";
import { PriceDisplay } from "./price-display";
import { WishlistButton } from "./wishlist-button";
import { cn } from "@/lib/utils";
import type { Product } from "@/data/types";

type Props = {
  product: Product;
  priority?: boolean;
  className?: string;
};

export function ProductCard({ product, priority = false, className }: Props) {
  const { addToCart, setCartOpen } = useShop();
  const variant = product.variants[0];
  const image = product.images[0];

  return (
    <article className={cn("group relative flex h-full flex-col", className)}>
      <div className="relative overflow-hidden rounded-sm bg-premium">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="block aspect-[4/5] focus-visible:outline-offset-4"
          tabIndex={-1}
          aria-hidden="true"
        >
          <img
            src={image?.src}
            alt=""
            width={1200}
            height={1500}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.03]"
          />
        </Link>

        {product.badges.length > 0 ? (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 2).map((b) => (
              <BrandBadge key={b} badge={b} />
            ))}
          </div>
        ) : null}

        <WishlistButton productId={product.id} productName={product.name} size="sm" className="absolute right-3 top-3" />

        <div className="absolute inset-x-3 bottom-3 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => {
              if (!variant) return;
              addToCart(product.id, variant.id, 1);
              setCartOpen(true);
              toast.success(`${product.name} added`, { description: variant.label });
            }}
            className="h-11 w-full rounded-sm border border-border bg-background/95 text-[0.8125rem] font-medium tracking-wide text-foreground backdrop-blur-[2px] transition-colors hover:bg-espresso hover:text-background"
          >
            Quick add
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col gap-1.5">
        <p className="eyebrow">{product.categoryCue}</p>
        <h3 className="font-display text-lg leading-snug">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="link-underline after:bg-driftwood"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-[0.8125rem] text-muted-foreground">{variant?.label}</p>
        {variant ? (
          <PriceDisplay
            price={variant.price}
            {...(variant.compareAtPrice ? { compareAtPrice: variant.compareAtPrice } : {})}
            className="mt-auto pt-2"
          />
        ) : null}
      </div>
    </article>
  );
}
