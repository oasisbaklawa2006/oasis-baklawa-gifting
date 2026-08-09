import { useState } from "react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { PriceDisplay } from "@/components/oasis/price-display";
import { QuantityControl } from "@/components/oasis/quantity-control";
import { WishlistButton } from "@/components/oasis/wishlist-button";
import { ProductCard } from "@/components/oasis/product-card";
import { SectionHeading } from "@/components/oasis/section-heading";
import { BrandBadge } from "@/components/oasis/chips";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getProductBySlug, products } from "@/data/catalog";
import type { Product } from "@/data/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }): { product: Product } => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product unavailable — Oasis Baklawa" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Oasis Baklawa` },
        { name: "description", content: product.shortDescription },
        { property: "og:title", content: `${product.name} — Oasis Baklawa` },
        { property: "og:description", content: product.shortDescription },
      ],
    };
  },
  component: ProductPage,
});

const availabilityLabel = {
  "in-stock": "In stock",
  "low-stock": "Limited availability",
  "made-to-order": "Made to order",
} as const;

function ProductPage() {
  const { product } = Route.useLoaderData() as { product: Product };
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const image = product.images[activeImage] ?? product.images[0];
  const related = products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4);

  const addToCart = () =>
    toast.success(`${product.name} added`, {
      description: `${variant?.label} × ${quantity} — cart is a UI placeholder in this build.`,
    });

  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: product.name }]}
        />
      </div>

      <section className="container-oasis grid gap-10 pb-16 pt-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="overflow-hidden rounded-sm bg-premium">
            <div className="aspect-[4/5]">
              <img
                src={image?.src}
                alt={image?.alt ?? product.name}
                width={1200}
                height={1500}
                fetchPriority="high"
                decoding="async"
                className="size-full object-cover"
              />
            </div>
          </div>
          <ul className="mt-4 flex gap-3">
            {product.images.map((img, i) => (
              <li key={img.src + i}>
                <button
                  type="button"
                  onClick={() => setActiveImage(i)}
                  aria-label={`Show image ${i + 1} of ${product.images.length}`}
                  aria-current={i === activeImage}
                  className={cn(
                    "block size-20 overflow-hidden rounded-sm border transition-colors",
                    i === activeImage ? "border-espresso" : "border-border hover:border-driftwood",
                  )}
                >
                  <img
                    src={img.src}
                    alt=""
                    width={160}
                    height={160}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="max-w-xl">
          {product.badges.length ? (
            <div className="flex flex-wrap gap-2">
              {product.badges.map((b) => (
                <BrandBadge key={b} badge={b} />
              ))}
            </div>
          ) : null}
          <p className="eyebrow mt-5">{product.categoryCue}</p>
          <h1 className="mt-3 text-3xl leading-tight md:text-[2.75rem]">{product.name}</h1>
          <p className="mt-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
            {product.description}
          </p>

          {variant ? (
            <PriceDisplay
              price={variant.price}
              {...(variant.compareAtPrice ? { compareAtPrice: variant.compareAtPrice } : {})}
              size="lg"
              className="mt-7"
            />
          ) : null}

          <fieldset className="mt-8">
            <legend className="eyebrow">Weight / pack</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={v.id === variantId}
                  className={cn(
                    "h-11 rounded-sm border px-4 text-[0.875rem] transition-colors",
                    v.id === variantId
                      ? "border-espresso bg-espresso text-background"
                      : "border-border hover:border-driftwood",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="mt-4 text-[0.8125rem] text-muted-foreground">
            {variant ? availabilityLabel[variant.availability] : ""} · {product.leadTime}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuantityControl value={quantity} onChange={setQuantity} />
            <Button size="lg" className="min-w-40 flex-1 sm:flex-none" onClick={addToCart}>
              Add to cart
            </Button>
            <Button size="lg" variant="outline" className="min-w-40 flex-1 sm:flex-none" onClick={addToCart}>
              Buy now
            </Button>
            <WishlistButton productName={product.name} />
          </div>

          <ul className="mt-9 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Secure payments", detail: "Provider to be confirmed" },
              { icon: PackageCheck, label: "Careful packing", detail: "Rigid box with inner tray" },
              { icon: Truck, label: "Delivery", detail: "Timelines shown at checkout" },
            ].map(({ icon: Icon, label, detail }) => (
              <li key={label} className="flex gap-3">
                <Icon className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[0.8125rem] font-medium">{label}</p>
                  <p className="text-[0.75rem] text-muted-foreground">{detail}</p>
                </div>
              </li>
            ))}
          </ul>

          <Accordion type="single" collapsible className="mt-4" defaultValue="description">
            <AccordionItem value="description" className="border-border">
              <AccordionTrigger className="text-[0.9375rem]">Description</AccordionTrigger>
              <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                {product.description}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="ingredients" className="border-border">
              <AccordionTrigger className="text-[0.9375rem]">Ingredients &amp; allergens</AccordionTrigger>
              <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                <p>{product.ingredients.join(", ")}.</p>
                <p className="mt-3">Allergens: {product.allergens.join(", ")}.</p>
                <p className="mt-3 text-[0.75rem]">
                  Placeholder information — final declarations to be supplied by Oasis Baklawa.
                </p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="storage" className="border-border">
              <AccordionTrigger className="text-[0.9375rem]">Storage &amp; shelf life</AccordionTrigger>
              <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                <p>{product.storage}</p>
                <p className="mt-3">{product.shelfLife}</p>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="shipping" className="border-border">
              <AccordionTrigger className="text-[0.9375rem]">Shipping</AccordionTrigger>
              <AccordionContent className="text-[0.875rem] leading-relaxed text-muted-foreground">
                Serviceable areas, dispatch windows and charges will be confirmed at checkout once
                logistics are finalised.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="details" className="border-border">
              <AccordionTrigger className="text-[0.9375rem]">Product details</AccordionTrigger>
              <AccordionContent>
                <dl className="grid gap-3 text-[0.875rem]">
                  {product.details.map((detail) => (
                    <div key={detail.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-3">
                      <dt className="text-muted-foreground">{detail.label}</dt>
                      <dd>{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {product.story ? (
        <section className="border-y border-border bg-premium">
          <div className="container-oasis section-y max-w-3xl text-center">
            <span className="gold-rule mx-auto block" aria-hidden="true" />
            <p className="mt-6 font-display text-xl leading-relaxed md:text-2xl">{product.story}</p>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="container-oasis section-y">
          <SectionHeading eyebrow="You may also like" title="From the same counter" />
          <div className="mt-12 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}

      {/* Mobile sticky add to cart */}
      <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-[6px] lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem]">{product.name}</p>
            {variant ? <PriceDisplay price={variant.price} size="sm" /> : null}
          </div>
          <Button onClick={addToCart} className="shrink-0">
            Add to cart
          </Button>
        </div>
      </div>
    </>
  );
}
