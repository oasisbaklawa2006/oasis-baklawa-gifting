import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";

import { useShop } from "@/lib/store";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { Breadcrumbs } from "@/components/oasis/breadcrumbs";
import { PriceDisplay } from "@/components/oasis/price-display";
import { QuantityControl } from "@/components/oasis/quantity-control";
import { WishlistButton } from "@/components/oasis/wishlist-button";
import { ProductCard } from "@/components/oasis/product-card";
import { SectionHeading } from "@/components/oasis/section-heading";
import { DeliveryEstimator } from "@/components/oasis/delivery-estimator";
import { ShareRow } from "@/components/oasis/share-row";
import { BrandBadge } from "@/components/oasis/chips";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { GIFT_MESSAGE_MAX } from "@/data/gifting";
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
    const variant = product.variants[0];
    return {
      meta: [
        { title: `${product.name} — Oasis Baklawa` },
        { name: "description", content: product.shortDescription },
        { property: "og:title", content: `${product.name} — Oasis Baklawa` },
        { property: "og:description", content: product.shortDescription },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${product.slug}` },
      ],
      links: [{ rel: "canonical", href: `/product/${product.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.shortDescription,
            category: product.categoryCue,
            brand: { "@type": "Brand", name: "Oasis Baklawa" },
            offers: variant
              ? {
                  "@type": "Offer",
                  price: variant.price.amount,
                  priceCurrency: variant.price.currency,
                  availability:
                    variant.availability === "in-stock"
                      ? "https://schema.org/InStock"
                      : variant.availability === "low-stock"
                        ? "https://schema.org/LimitedAvailability"
                        : "https://schema.org/PreOrder",
                }
              : undefined,
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "/" },
              { "@type": "ListItem", position: 2, name: "Shop", item: "/shop" },
              {
                "@type": "ListItem",
                position: 3,
                name: product.name,
                item: `/product/${product.slug}`,
              },
            ],
          }),
        },
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
  const [perspective, setPerspective] = useState<"confectionery" | "packaging">("confectionery");
  const [giftMessage, setGiftMessage] = useState("");
  const [conceal, setConceal] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const image = product.images[activeImage] ?? product.images[0];
  const related = products.filter((p) => p.id !== product.id && p.categoryId === product.categoryId).slice(0, 4);

  const { addToCart: addLine, setCartOpen, setGift } = useShop();

  const addToCart = () => {
    if (!variant) return;
    addLine(product.id, variant.id, quantity);
    if (giftMessage || conceal) setGift({ message: giftMessage, concealInvoice: conceal });
    setCartOpen(true);
    toast.success(`${product.name} added`, {
      description: `${variant.label} × ${quantity}`,
    });
  };


  return (
    <>
      <div className="container-oasis pt-8">
        <Breadcrumbs
          items={[{ label: "Home", to: "/" }, { label: "Shop", to: "/shop" }, { label: product.name }]}
        />
      </div>

      <section className="container-oasis grid gap-10 pb-16 pt-8 lg:grid-cols-2 lg:gap-16">
        <div>
          <div
            role="group"
            aria-label="Product view"
            className="mb-4 inline-flex rounded-sm border border-border p-1"
          >
            {([
              ["confectionery", "View Confectionery"],
              ["packaging", "View Gift Packaging"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setPerspective(key);
                  setActiveImage(key === "packaging" ? Math.min(2, product.images.length - 1) : 0);
                }}
                aria-pressed={perspective === key}
                className={cn(
                  "h-11 rounded-sm px-4 text-[0.8125rem] transition-colors duration-200 ease-out",
                  perspective === key ? "bg-espresso text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
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
            <WishlistButton productId={product.id} productName={product.name} />
          </div>

          <ul className="mt-9 grid gap-4 border-y border-border py-6 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Secure payments", detail: "Provider to be confirmed" },
              { icon: PackageCheck, label: "Careful packing", detail: "Rigid box with inner tray" },
              { icon: Truck, label: "Delivery", detail: "Estimate by PIN code below" },
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


          <div className="mt-8 rounded-sm border border-border bg-premium p-5">
            <p className="eyebrow">Send as a gift</p>
            <label htmlFor="pdp-gift-message" className="mt-4 block text-[0.875rem] font-medium">
              Gift card message
            </label>
            <Textarea
              id="pdp-gift-message"
              rows={3}
              maxLength={GIFT_MESSAGE_MAX}
              value={giftMessage}
              onChange={(e) => setGiftMessage(e.target.value)}
              className="mt-2 bg-background"
              placeholder="Written by hand onto the gift card."
            />
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              {giftMessage.length} / {GIFT_MESSAGE_MAX}
            </p>
            <div className="mt-4 rounded-sm border border-border bg-card p-5">
              <p className="eyebrow">Card preview</p>
              <p className="mt-2 whitespace-pre-wrap font-display text-base leading-relaxed">
                {giftMessage || "Your message will appear here."}
              </p>
            </div>
            <label className="mt-4 flex items-start gap-3 text-[0.875rem]">
              <Checkbox checked={conceal} onCheckedChange={(v) => setConceal(v === true)} className="mt-0.5" />
              <span>This order is a gift — conceal prices and invoice slips from the shipping parcel.</span>
            </label>
          </div>

          <div className="mt-8">
            <p className="eyebrow">Dietary &amp; compliance</p>
            {product.verifiedClaims && product.verifiedClaims.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.verifiedClaims.map((claim) => (
                  <li key={claim} className="rounded-sm border border-gold/60 px-3 py-1 text-[0.75rem]">
                    {claim}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                No dietary or certification claims are published for this product. Verified information will
                appear here once supplied by Oasis Baklawa.
              </p>
            )}
          </div>

          <DeliveryEstimator compact className="mt-6" />

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
                <p>
                  Dispatched in a rigid insulated box, tracked end to end. Orders placed before the
                  daily cut-off join the same day&rsquo;s dispatch run; there is no Sunday dispatch.
                </p>
                <p className="mt-3">
                  See{" "}
                  <Link to="/shipping" className="text-foreground underline decoration-gold/70 underline-offset-4">
                    shipping zones and delivery times
                  </Link>{" "}
                  or{" "}
                  <Link to="/track-order" className="text-foreground underline decoration-gold/70 underline-offset-4">
                    track an existing order
                  </Link>
                  .
                </p>
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

          <ShareRow
            title={`${product.name} — Oasis Baklawa`}
            path={`/product/${product.slug}`}
            className="mt-8 border-t border-border pt-6"
          />

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
