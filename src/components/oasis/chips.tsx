import { cn } from "@/lib/utils";
import type { ProductBadge } from "@/data/types";

const labels: Record<ProductBadge, string> = {
  signature: "Signature",
  new: "New",
  bestseller: "Best seller",
  gifting: "Gifting",
  seasonal: "Seasonal",
};

export function BrandBadge({ badge, className }: { badge: ProductBadge; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-xs border border-gold/70 bg-background/90 px-2 py-1 text-[0.625rem] uppercase tracking-[0.16em] text-earth backdrop-blur-[2px]",
        className,
      )}
    >
      {labels[badge]}
    </span>
  );
}

export function Chip({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-[0.8125rem] transition-colors duration-300",
        active
          ? "border-espresso bg-espresso text-background"
          : "border-border bg-transparent text-foreground hover:border-driftwood hover:bg-premium",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
