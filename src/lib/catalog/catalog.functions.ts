/**
 * Server boundary for the catalogue projection.
 *
 * `getCommerceCatalogue` is a public read: it returns only the commerce-eligible
 * slice (slug, option label, current price, original price) that the storefront
 * must render. `importCatalogueBatch` is privileged and requires a shared
 * import token held in project secrets.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { products } from "@/data/catalog";

import { importBatchSchema } from "./import-contract";
import type { CatalogueImportResult, CatalogueStats, CommerceCatalogue } from "./types";
import { EMPTY_CATALOGUE } from "./types";

export const getCommerceCatalogue = createServerFn({ method: "GET" }).handler(
  async (): Promise<CommerceCatalogue> => {
    try {
      const { readCommerceCatalogue } = await import("./projection.server");
      return await readCommerceCatalogue();
    } catch (error) {
      // Fail closed: an unreadable projection means nothing is purchasable.
      return { ...EMPTY_CATALOGUE, error: (error as Error).message };
    }
  },
);

export const catalogueStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<CatalogueStats> => {
    const { readCatalogueStats } = await import("./projection.server");
    return readCatalogueStats(products.length);
  },
);

/**
 * Bounded, idempotent bulk import of approved source records.
 * Requires CATALOGUE_IMPORT_TOKEN; without it the endpoint does nothing.
 */
export const importCatalogueBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    importBatchSchema.extend({ token: z.string().min(16) }).parse(input),
  )
  .handler(async ({ data }): Promise<CatalogueImportResult> => {
    const expected = process.env["CATALOGUE_IMPORT_TOKEN"] ?? "";
    if (!expected || data.token !== expected) {
      return {
        status: "rejected",
        productsUpserted: 0,
        variantsUpserted: 0,
        rejected: data.records.length,
        errors: [{ source: "auth", message: "Import token missing or incorrect." }],
      };
    }

    const { importCatalogueRecords } = await import("./projection.server");
    return importCatalogueRecords({
      provider: data.provider,
      records: data.records,
      ...(data.note ? { note: data.note } : {}),
    });
  });
