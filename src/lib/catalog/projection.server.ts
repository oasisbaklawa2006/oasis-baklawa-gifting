/**
 * CATALOGUE PROJECTION (server-only)
 *
 * Durable read/write access to the approved catalogue projection. The tables
 * carry row level security with no policies and are granted to the service
 * role only, so nothing reachable from a browser can read or write them.
 *
 * This module reads only what the storefront legitimately needs. Internal
 * source cost, margin and profit fields are never selected or stored.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Money } from "@/data/types";

import type {
  CatalogueImportResult,
  CatalogueOptionKind,
  CatalogueProductEntry,
  CatalogueProvider,
  CatalogueStats,
  CatalogueVariantEntry,
  CommerceCatalogue,
} from "./types";
import { EMPTY_CATALOGUE } from "./types";
import { validateImportRecords, type ImportProductInput } from "./import-contract";

export function catalogueConfigured(): boolean {
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_SERVICE_ROLE_KEY"]);
}

const money = (amount: number, currency: string): Money => ({
  amount,
  currency: (currency as Money["currency"]) ?? "INR",
});

type VariantRow = {
  source_variant_id: string;
  option_label: string | null;
  option_kind: string;
  regular_price: number | string | null;
  current_price: number | string;
  currency: string;
  sku: string | null;
  position: number;
};

type ProductRow = {
  slug: string;
  provider: string;
  source_product_id: string;
  display_name: string;
  source_name: string | null;
  sku: string | null;
  website_catalog_variants: VariantRow[] | null;
};

const num = (value: number | string | null): number | null =>
  value == null ? null : typeof value === "number" ? value : Number(value);

function toEntry(row: ProductRow): CatalogueProductEntry | null {
  const variants: CatalogueVariantEntry[] = (row.website_catalog_variants ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .flatMap((variant) => {
      const current = num(variant.current_price);
      const regular = num(variant.regular_price);
      if (current == null || !(current > 0)) return [];
      return [
        {
          variantId: variant.source_variant_id,
          label: variant.option_label,
          optionKind: variant.option_kind as CatalogueOptionKind,
          price: money(current, variant.currency),
          // Only a genuinely higher original price is shown as compare-at.
          ...(regular != null && regular > current
            ? { compareAtPrice: money(regular, variant.currency) }
            : {}),
          ...(variant.sku ? { sku: variant.sku } : {}),
        },
      ];
    });

  if (variants.length === 0) return null;

  return {
    slug: row.slug,
    provider: row.provider as CatalogueProvider,
    sourceProductId: row.source_product_id,
    displayName: row.display_name,
    ...(row.source_name ? { sourceName: row.source_name } : {}),
    ...(row.sku ? { sku: row.sku } : {}),
    variants,
  };
}

/**
 * The commerce-eligible catalogue. A read failure returns `available: false`
 * with the reason — never a silently empty catalogue that looks like "no
 * products are on sale".
 */
export async function readCommerceCatalogue(): Promise<CommerceCatalogue> {
  if (!catalogueConfigured()) {
    return { ...EMPTY_CATALOGUE, error: "Catalogue database is not configured." };
  }

  const { data, error } = await supabaseAdmin
    .from("website_catalog_products")
    .select(
      "slug, provider, source_product_id, display_name, source_name, sku, website_catalog_variants(source_variant_id, option_label, option_kind, regular_price, current_price, currency, sku, position, published, commerce_eligible)",
    )
    .eq("published", true)
    .eq("commerce_verified", true)
    .eq("website_catalog_variants.published", true)
    .eq("website_catalog_variants.commerce_eligible", true);

  if (error) {
    return { ...EMPTY_CATALOGUE, error: error.message };
  }

  const entries: Record<string, CatalogueProductEntry> = {};
  let provider: CatalogueProvider | "none" = "none";

  for (const row of (data ?? []) as unknown as ProductRow[]) {
    const entry = toEntry(row);
    if (!entry) continue;
    entries[entry.slug] = entry;
    provider = entry.provider;
  }

  return {
    provider,
    available: true,
    generatedAt: new Date().toISOString(),
    entries,
  };
}

/* ------------------------------ Statistics ----------------------------- */

export async function readCatalogueStats(totalSiteProducts: number): Promise<CatalogueStats> {
  const catalogue = await readCommerceCatalogue();
  const verifiedProducts = Object.keys(catalogue.entries).length;
  const verifiedVariants = Object.values(catalogue.entries).reduce(
    (sum, entry) => sum + entry.variants.length,
    0,
  );

  let lastRun: CatalogueStats["lastRun"] = null;
  if (catalogueConfigured()) {
    const { data } = await supabaseAdmin
      .from("website_catalog_sync_runs")
      .select("provider, mode, status, products_upserted, variants_upserted, rejected, finished_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      lastRun = {
        provider: data.provider,
        mode: data.mode,
        status: data.status,
        productsUpserted: data.products_upserted,
        variantsUpserted: data.variants_upserted,
        rejected: data.rejected,
        finishedAt: data.finished_at,
      };
    }
  }

  const authority: CatalogueStats["authority"] =
    catalogue.provider === "appverse"
      ? "appverse"
      : catalogue.provider === "none"
        ? "none"
        : "wix_migration";

  return {
    provider: catalogue.provider,
    authority,
    available: catalogue.available,
    verifiedProducts,
    verifiedVariants,
    blockedProducts: Math.max(0, totalSiteProducts - verifiedProducts),
    totalSiteProducts,
    lastRun,
    note: catalogue.available
      ? "Only projection-backed products can be priced, added to a basket, checked out or published to a shopping feed. Everything else is editorial only."
      : (catalogue.error ??
        "The catalogue projection could not be read, so no product is purchasable."),
  };
}

/* -------------------------------- Import ------------------------------- */

type UpsertCounts = { products: number; variants: number };

async function upsertRecord(
  provider: CatalogueProvider,
  record: ImportProductInput,
): Promise<UpsertCounts> {
  const now = new Date().toISOString();

  const { data: product, error: productError } = await supabaseAdmin
    .from("website_catalog_products")
    .upsert(
      {
        provider,
        source_product_id: record.sourceProductId,
        slug: record.slug,
        display_name: record.displayName,
        source_name: record.sourceName ?? null,
        sku: record.sku ?? null,
        category_cue: record.categoryCue ?? null,
        currency: record.variants[0]?.currency ?? "INR",
        media: record.media,
        published: record.published,
        // Verified because every accepted record carries an audited price.
        commerce_verified: true,
        provenance: { source: provider, imported_at: now },
        source_updated_at: record.sourceUpdatedAt ?? null,
        synced_at: now,
      },
      { onConflict: "provider,source_product_id" },
    )
    .select("id")
    .single();

  if (productError || !product) {
    throw new Error(productError?.message ?? "product upsert returned no row");
  }

  const { error: variantError, count } = await supabaseAdmin
    .from("website_catalog_variants")
    .upsert(
      record.variants.map((variant) => ({
        product_id: product.id,
        source_variant_id: variant.sourceVariantId,
        option_label: variant.optionLabel ?? null,
        option_kind: variant.optionKind,
        regular_price: variant.regularPrice ?? null,
        current_price: variant.currentPrice,
        currency: variant.currency,
        sku: variant.sku ?? null,
        position: variant.position,
        published: variant.published,
        commerce_eligible: true,
        source_updated_at: record.sourceUpdatedAt ?? null,
        synced_at: now,
      })),
      { onConflict: "product_id,source_variant_id", count: "exact" },
    );

  if (variantError) throw new Error(variantError.message);

  return { products: 1, variants: count ?? record.variants.length };
}

/**
 * Idempotent bulk upsert keyed on (provider, sourceProductId) and
 * (product, sourceVariantId). Re-running the same batch never duplicates a
 * row. Every rejection is reported; nothing is silently corrected.
 */
export async function importCatalogueRecords(input: {
  provider: CatalogueProvider;
  records: unknown[];
  note?: string;
}): Promise<CatalogueImportResult> {
  if (!catalogueConfigured()) {
    return {
      status: "failed",
      productsUpserted: 0,
      variantsUpserted: 0,
      rejected: input.records.length,
      errors: [{ source: "database", message: "Catalogue database is not configured." }],
    };
  }

  const { valid, rejected } = validateImportRecords(input.records);
  const startedAt = new Date().toISOString();
  const errors = [...rejected];
  let products = 0;
  let variants = 0;

  for (const record of valid) {
    try {
      const counts = await upsertRecord(input.provider, record);
      products += counts.products;
      variants += counts.variants;
    } catch (error) {
      errors.push({ source: record.sourceProductId, message: (error as Error).message });
    }
  }

  const status: CatalogueImportResult["status"] =
    products === 0 ? "failed" : errors.length > 0 ? "partial" : "completed";

  const { data: run } = await supabaseAdmin
    .from("website_catalog_sync_runs")
    .insert({
      provider: input.provider,
      mode: "batch_upsert",
      status: status === "failed" ? "failed" : status === "partial" ? "partial" : "completed",
      products_upserted: products,
      variants_upserted: variants,
      rejected: errors.length,
      errors: errors.slice(0, 50),
      note: input.note ?? null,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  return {
    status,
    ...(run?.id ? { runId: run.id } : {}),
    productsUpserted: products,
    variantsUpserted: variants,
    rejected: errors.length,
    errors: errors.slice(0, 50),
  };
}
