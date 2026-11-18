import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";

import { QuantityControl } from "@/components/oasis/quantity-control";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { resolveLines, useShop } from "@/lib/store";
import { noImage } from "@/data/brand";

export function CartDrawer() {
  const { lines, cartOpen, setCartOpen, setQuantity, removeLine, gift } = useShop();
  const resolved = resolveLines(lines);

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="flex w-[92vw] max-w-md flex-col bg-background p-0">
        <SheetHeader className="border-b border-border px-5 py-4 text-left">
          <SheetTitle className="font-display text-lg">
            Your bag {resolved.length > 0 ? `(${resolved.length})` : ""}
          </SheetTitle>
        </SheetHeader>

        {resolved.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="gold-rule block" aria-hidden="true" />
            <p className="font-display text-xl">Your bag is empty</p>
            <p className="text-sm text-muted-foreground">
              Add something from the range to see it here.
            </p>
            <Button asChild onClick={() => setCartOpen(false)}>
              <Link to="/shop">Browse the range</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
              {resolved.map(({ line, product, variant }) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-5">
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    onClick={() => setCartOpen(false)}
                    className="w-20 shrink-0 overflow-hidden rounded-sm bg-premium"
                  >
                    <img
                      src={product.images[0]?.src ?? noImage.src}
                      alt={product.images[0]?.alt ?? ""}
                      width={320}
                      height={400}
                      loading="lazy"
                      className="aspect-[4/5] size-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-[0.9375rem]">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{variant.label}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(line.productId, line.variantId)}
                        aria-label={`Remove ${product.name} from bag`}
                        className="grid size-8 shrink-0 place-items-center rounded-sm text-driftwood transition-colors hover:bg-premium hover:text-foreground"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <QuantityControl
                        value={line.quantity}
                        min={0}
                        onChange={(q) => setQuantity(line.productId, line.variantId, q)}
                        className="h-9"
                      />
                      <span className="text-xs text-muted-foreground">Price unavailable</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <SheetFooter className="border-t border-border bg-utility px-5 py-5">
              <div className="w-full space-y-4">
                {gift.message || gift.concealInvoice ? (
                  <div className="rounded-sm border border-border bg-background p-4 text-left">
                    <p className="eyebrow">Gifting</p>
                    {gift.message ? (
                      <p className="mt-2 line-clamp-3 font-display text-[0.9375rem] leading-relaxed">
                        &ldquo;{gift.message}&rdquo;
                      </p>
                    ) : null}
                    {gift.concealInvoice ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Prices and invoice slips will be concealed in the parcel.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Live prices and delivery offers are not published for this sample catalogue.
                </p>

                <div className="rounded-sm border border-dashed border-border p-4 text-left">
                  <p className="eyebrow">Add to your gift</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Curated add-ons (cards, ribbons, small confections) will appear here.
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Order totals will be shown only after authoritative Core retail pricing is available.
                </p>
                <p className="text-xs text-muted-foreground">
                  Online ordering is currently unavailable.
                </p>
                <div className="grid gap-2">
                  <Button asChild size="lg" onClick={() => setCartOpen(false)}>
                    <Link to="/cart">View bag</Link>
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => setCartOpen(false)}>
                    Continue shopping
                  </Button>
                </div>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
