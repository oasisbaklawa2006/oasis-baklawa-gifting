import { createFileRoute, Link } from "@tanstack/react-router";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { PriceDisplay } from "@/components/oasis/price-display";
import { QuantityControl } from "@/components/oasis/quantity-control";
import { EmptyState } from "@/components/oasis/states";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatMoney } from "@/lib/format";
import { cartSubtotal, resolveLines, useShop } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Oasis Baklawa" },
      {
        name: "description",
        content:
          "Review the baklawa, Arabic sweets and gift boxes in your Oasis Baklawa bag before enquiring or ordering.",
      },
      { property: "og:title", content: "Your Bag — Oasis Baklawa" },
      { property: "og:description", content: "Review your Oasis Baklawa selection." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { lines, setQuantity, removeLine, clearCart } = useShop();
  const resolved = resolveLines(lines);
  const subtotal = cartSubtotal(resolved);

  return (
    <div className="container-oasis py-8 md:py-12">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Bag" }]} />
      <h1 className="mt-6 text-3xl md:text-[2.5rem]">Your bag</h1>

      {resolved.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Nothing in your bag yet"
            description="Browse the range and add a tray, box or hamper to get started."
            action={
              <Button asChild>
                <Link to="/shop">Browse the range</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div>
            <ul className="divide-y divide-border border-y border-border">
              {resolved.map(({ line, product, variant, lineTotal }) => (
                <li key={`${line.productId}-${line.variantId}`} className="flex gap-4 py-6 sm:gap-6">
                  <Link
                    to="/product/$slug"
                    params={{ slug: product.slug }}
                    className="w-24 shrink-0 overflow-hidden rounded-sm bg-premium sm:w-32"
                  >
                    <img
                      src={product.images[0]?.src}
                      alt={product.images[0]?.alt ?? ""}
                      width={400}
                      height={500}
                      loading="lazy"
                      className="aspect-[4/5] size-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="eyebrow">{product.categoryCue}</p>
                    <h2 className="mt-1 font-display text-lg leading-snug">
                      <Link to="/product/$slug" params={{ slug: product.slug }} className="link-underline">
                        {product.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-[0.8125rem] text-muted-foreground">{variant.label}</p>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                      <QuantityControl
                        value={line.quantity}
                        min={0}
                        onChange={(q) => setQuantity(line.productId, line.variantId, q)}
                      />
                      <PriceDisplay price={lineTotal} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeLine(line.productId, line.variantId)}
                      className="mt-3 self-start text-[0.75rem] uppercase tracking-[0.12em] text-driftwood underline-offset-4 hover:text-foreground hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Button variant="ghost" onClick={clearCart}>
                Clear bag
              </Button>
              <Button variant="outline" asChild>
                <Link to="/shop">Continue shopping</Link>
              </Button>
            </div>
          </div>

          <aside className="h-fit border border-border bg-premium p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-xl">Order summary</h2>
            <Separator className="my-5 bg-border" />
            <dl className="space-y-3 text-[0.875rem]">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="text-muted-foreground">Calculated later</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Taxes</dt>
                <dd className="text-muted-foreground">Calculated later</dd>
              </div>
            </dl>
            <Separator className="my-5 bg-border" />
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Estimated total</span>
              <span className="font-display text-xl tabular-nums">{formatMoney(subtotal)}</span>
            </div>
            <Button size="lg" className="mt-6 w-full" disabled>
              Checkout unavailable
            </Button>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Payments are not connected in this build. For volume or corporate orders, use the
              business enquiry form.
            </p>
            <Button variant="outline" className="mt-4 w-full" asChild>
              <Link to="/business">Corporate & bulk enquiry</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
