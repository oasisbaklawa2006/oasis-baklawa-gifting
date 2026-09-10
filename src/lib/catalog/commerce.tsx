/**
 * COMMERCE ELIGIBILITY (client)
 *
 * One rule, applied everywhere: a product is purchasable only when the
 * catalogue projection carries a verified price for it. Everything else is
 * editorial — browsable, shareable, enquirable, never priced or bought.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { products } from "@/data/catalog";
import type { Money, Product } from "@/data/types";

import type { CatalogueProductEntry, CatalogueVariantEntry, CommerceCatalogue } from "./types";
import { EMPTY_CATALOGUE } from "./types";

const CatalogueContext = createContext<CommerceCatalogue>(EMPTY_CATALOGUE);

export function CommerceCatalogueProvider({
  catalogue,
  children,
}: {
  catalogue: CommerceCatalogue;
  children: ReactNode;
}) {
  return <CatalogueContext.Provider value={catalogue}>{children}</CatalogueContext.Provider>;
}

export function useCommerceCatalogue(): CommerceCatalogue {
  return useContext(CatalogueContext);
}

/* ------------------------------- Lookups ------------------------------- */

/** Site product id -> slug. Built once from the editorial catalogue. */
const slugById = new Map(products.map((product) => [product.id, product.slug]));

export function entryForSlug(
  catalogue: CommerceCatalogue,
  slug: string,
): CatalogueProductEntry | undefined {
  return catalogue.entries[slug];
}

export function entryForProductId(
  catalogue: CommerceCatalogue,
  productId: string,
): CatalogueProductEntry | undefined {
  const slug = slugById.get(productId);
  return slug ? catalogue.entries[slug] : undefined;
}

export function variantEntry(
  catalogue: CommerceCatalogue,
  productId: string,
  variantId: string,
): CatalogueVariantEntry | undefined {
  return entryForProductId(catalogue, productId)?.variants.find((v) => v.variantId === variantId);
}

export type ProductCommerce = {
  /** True only when a verified price exists for at least one option. */
  purchasable: boolean;
  entry?: CatalogueProductEntry;
  /** Options the customer may actually choose, in projection order. */
  options: CatalogueVariantEntry[];
  /** The option shown when nothing is selected yet. */
  lead?: CatalogueVariantEntry;
};

export function productCommerce(
  catalogue: CommerceCatalogue,
  product: Pick<Product, "id" | "slug">,
): ProductCommerce {
  const entry = catalogue.entries[product.slug];
  const options = entry?.variants ?? [];
  return {
    purchasable: options.length > 0,
    ...(entry ? { entry } : {}),
    options,
    ...(options[0] ? { lead: options[0] } : {}),
  };
}

export function useProductCommerce(product: Pick<Product, "id" | "slug">): ProductCommerce {
  const catalogue = useCommerceCatalogue();
  return useMemo(() => productCommerce(catalogue, product), [catalogue, product]);
}

/* ------------------------------ Cart lines ----------------------------- */

export type CartLineInput = { productId: string; variantId: string; quantity: number };

export type PricedLine = {
  line: CartLineInput;
  product: Product;
  option: CatalogueVariantEntry;
  lineTotal: Money;
};

export type RejectedLine = {
  line: CartLineInput;
  product?: Product;
  reason: "unknown-product" | "not-commerce-eligible";
};

export type ResolvedCart = {
  lines: PricedLine[];
  rejected: RejectedLine[];
  subtotal: Money;
};

/**
 * Resolves stored basket lines against the projection. A line whose product or
 * option is no longer commerce-eligible is rejected, never silently priced.
 */
export function resolveCart(catalogue: CommerceCatalogue, lines: CartLineInput[]): ResolvedCart {
  const priced: PricedLine[] = [];
  const rejected: RejectedLine[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.id === line.productId);
    if (!product) {
      rejected.push({ line, reason: "unknown-product" });
      continue;
    }
    const option = variantEntry(catalogue, line.productId, line.variantId);
    if (!option) {
      rejected.push({ line, product, reason: "not-commerce-eligible" });
      continue;
    }
    priced.push({
      line,
      product,
      option,
      lineTotal: {
        amount: option.price.amount * line.quantity,
        currency: option.price.currency,
      },
    });
  }

  return {
    lines: priced,
    rejected,
    subtotal: {
      amount: priced.reduce((sum, entry) => sum + entry.lineTotal.amount, 0),
      currency: priced[0]?.lineTotal.currency ?? "INR",
    },
  };
}

export function useResolvedCart(lines: CartLineInput[]): ResolvedCart {
  const catalogue = useCommerceCatalogue();
  return useMemo(() => resolveCart(catalogue, lines), [catalogue, lines]);
}
