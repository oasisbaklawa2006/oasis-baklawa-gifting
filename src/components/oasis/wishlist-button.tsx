import { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  productName: string;
  className?: string;
  size?: "sm" | "md";
};

/** Local UI state only — wire to a real wishlist service later. */
export function WishlistButton({ productName, className, size = "md" }: Props) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setSaved((s) => !s)}
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
