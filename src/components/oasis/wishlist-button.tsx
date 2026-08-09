import { Heart } from "lucide-react";

import { cn } from "@/lib/utils";
import { useShop } from "@/lib/store";

type Props = {
  productId: string;
  productName: string;
  className?: string;
  size?: "sm" | "md";
};

/** Persisted to localStorage via ShopProvider — wire to an account service later. */
export function WishlistButton({ productId, productName, className, size = "md" }: Props) {
  const { isWishlisted, toggleWishlist } = useShop();
  const saved = isWishlisted(productId);

  return (
    <button
      type="button"
      onClick={() => toggleWishlist(productId)}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full border border-border bg-background/90 text-foreground transition-colors duration-300 hover:border-driftwood",
        size === "md" ? "size-11" : "size-9",
        saved && "border-gold text-earth",
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-gold text-gold")} />
    </button>
  );
}
