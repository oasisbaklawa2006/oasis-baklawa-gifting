/**
 * CATALOGUE PROJECTION CONTRACT
 *
 * The website never invents commerce truth. Prices, options and purchasability
 * come from a durable server-side projection of the approved catalogue
 * (`website_catalog_products` / `website_catalog_variants`).
 *
 * The projection carries its source provider. Today that is `wix_migration`
 * — records audited from the published Wix Stores Catalog V1. When Oasis
 * Central / Appverse becomes the operational authority the provider switches
 * to `appverse` and nothing in the routes or components changes.
 *
 * A product that is not in the projection is EDITORIAL ONLY: it may be
 * browsed, but it can never be priced, added to a basket, checked out,
 * emitted as an Offer or published to a shopping feed.
 */

import type { Money } from "@/data/types";

export type CatalogueProvider = "wix_migration" | "appverse" | "manual";

/** How a variant's option should be read. Never inferred from a raw weight. */
export type CatalogueOptionKind = "single" | "pack" | "weight" | "choice";

export type CatalogueVariantEntry = {
  /** Matches the site variant id so a stored basket line resolves directly. */
  variantId: string;
  /** Customer-facing option label, or null when the product has one option. */
  label: string | null;
  optionKind: CatalogueOptionKind;
  /** Current customer price — the sale price where one is verified. */
  price: Money;
  /** Original price, present only when it is genuinely higher than current. */
  compareAtPrice?: Money;
  sku?: string;
};

export type CatalogueProductEntry = {
  slug: string;
  provider: CatalogueProvider;
  sourceProductId: string;
  displayName: string;
  /** Raw source title, kept for provenance; never used for display. */
  sourceName?: string;
  sku?: string;
  variants: CatalogueVariantEntry[];
};

/**
 * The commerce-eligible slice of the catalogue, keyed by slug. Anything absent
 * from `entries` is not purchasable — this is the single eligibility test used
 * by the storefront, the feeds and the cart.
 */
export type CommerceCatalogue = {
  provider: CatalogueProvider | "none";
  available: boolean;
  generatedAt: string;
  entries: Record<string, CatalogueProductEntry>;
  /** Present when the projection could not be read; never faked as empty-ok. */
  error?: string;
};

export const EMPTY_CATALOGUE: CommerceCatalogue = {
  provider: "none",
  available: false,
  generatedAt: "1970-01-01T00:00:00.000Z",
  entries: {},
};

/* --------------------------- Import contract --------------------------- */

export type CatalogueImportError = { source: string; message: string };

export type CatalogueImportResult = {
  status: "completed" | "partial" | "failed" | "rejected";
  runId?: string;
  productsUpserted: number;
  variantsUpserted: number;
  rejected: number;
  errors: CatalogueImportError[];
};

/* ------------------------------ Statistics ----------------------------- */

export type CatalogueStats = {
  provider: CatalogueProvider | "none";
  /** Authority currently in force for products, prices and orders. */
  authority: "appverse" | "wix_migration" | "none";
  available: boolean;
  verifiedProducts: number;
  verifiedVariants: number;
  /** Site products with no verified projection row — blocked from commerce. */
  blockedProducts: number;
  totalSiteProducts: number;
  lastRun: {
    provider: string;
    mode: string;
    status: string;
    productsUpserted: number;
    variantsUpserted: number;
    rejected: number;
    finishedAt: string | null;
  } | null;
  note: string;
};
