import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Money } from "@/data/types";

type Props = {
  price: Money;
  compareAtPrice?: Money;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "text-sm",
  md: "text-[0.9375rem]",
  lg: "text-xl",
};

export function PriceDisplay({ price, compareAtPrice, size = "md", className }: Props) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-2 font-medium tabular-nums",
        sizes[size],
        className,
      )}
    >
      <span className="text-foreground">{formatMoney(price)}</span>
      {compareAtPrice ? (
        <>
          <span className="text-xs font-normal text-muted-foreground line-through">
            {formatMoney(compareAtPrice)}
          </span>
          <span className="sr-only">reduced from {formatMoney(compareAtPrice)}</span>
        </>
      ) : null}
    </p>
  );
}
