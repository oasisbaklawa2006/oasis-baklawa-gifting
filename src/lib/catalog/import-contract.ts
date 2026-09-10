/**
 * BULK IMPORT CONTRACT
 *
 * Validated shape for feeding approved Wix Catalog V1 (or later Appverse)
 * records into the catalogue projection in bounded batches. Validation is
 * strict and total: a malformed currency, a non-positive price or a sale price
 * above the regular price is rejected with a reason rather than corrected.
 *
 * Nothing here invents a missing field. Absent option labels, SKUs and media
 * stay absent.
 */

import { z } from "zod";

/** Batches are bounded so one import can never lock the table for minutes. */
export const IMPORT_BATCH_LIMIT = 200;

const currency = z
  .string()
  .trim()
  .regex(/^[A-Z]{3}$/, "currency must be a 3-letter ISO code")
  .refine((value) => value === "INR" || value === "AED" || value === "USD", {
    message: "unsupported settlement currency",
  });

const price = z.number().finite().positive().max(10_000_000);

export const importVariantSchema = z
  .object({
    sourceVariantId: z.string().trim().min(1).max(120),
    /** Site-facing option label exactly as published. Never derived. */
    optionLabel: z.string().trim().min(1).max(120).nullish(),
    optionKind: z.enum(["single", "pack", "weight", "choice"]).default("single"),
    regularPrice: price.nullish(),
    currentPrice: price,
    currency: currency.default("INR"),
    sku: z.string().trim().min(1).max(120).nullish(),
    position: z.number().int().min(0).max(999).default(0),
    published: z.boolean().default(true),
  })
  .refine((v) => v.regularPrice == null || v.regularPrice >= v.currentPrice, {
    message: "regularPrice must not be lower than currentPrice",
  });

export const importProductSchema = z.object({
  sourceProductId: z.string().trim().min(1).max(120),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lower-case and hyphenated"),
  displayName: z.string().trim().min(1).max(200),
  sourceName: z.string().trim().min(1).max(200).nullish(),
  sku: z.string().trim().min(1).max(120).nullish(),
  categoryCue: z.string().trim().min(1).max(120).nullish(),
  media: z
    .array(z.object({ src: z.string().url(), alt: z.string().max(300).default("") }))
    .max(12)
    .default([]),
  published: z.boolean().default(true),
  sourceUpdatedAt: z.string().datetime().nullish(),
  variants: z.array(importVariantSchema).min(1).max(50),
});

export const importBatchSchema = z.object({
  provider: z.enum(["wix_migration", "appverse", "manual"]).default("wix_migration"),
  /** Free-text provenance note recorded on the sync run. */
  note: z.string().trim().max(300).optional(),
  records: z.array(z.unknown()).min(1).max(IMPORT_BATCH_LIMIT),
});

export type ImportVariantInput = z.infer<typeof importVariantSchema>;
export type ImportProductInput = z.infer<typeof importProductSchema>;
export type ImportBatchInput = z.infer<typeof importBatchSchema>;

export type ValidatedBatch = {
  valid: ImportProductInput[];
  rejected: { source: string; message: string }[];
};

/**
 * Validates each record independently so one bad row never discards a batch.
 * Returns the accepted records plus a reason for every rejection.
 */
export function validateImportRecords(records: unknown[]): ValidatedBatch {
  const valid: ImportProductInput[] = [];
  const rejected: { source: string; message: string }[] = [];
  const seen = new Set<string>();

  for (const [index, record] of records.entries()) {
    const parsed = importProductSchema.safeParse(record);
    if (!parsed.success) {
      const label =
        (record as { sourceProductId?: string; slug?: string })?.sourceProductId ??
        (record as { slug?: string })?.slug ??
        `record[${index}]`;
      rejected.push({
        source: String(label),
        message: parsed.error.issues
          .map((issue) => `${issue.path.join(".") || "record"}: ${issue.message}`)
          .join("; "),
      });
      continue;
    }

    const key = parsed.data.sourceProductId;
    if (seen.has(key)) {
      rejected.push({ source: key, message: "duplicate sourceProductId within the batch" });
      continue;
    }

    const variantIds = new Set<string>();
    const duplicateVariant = parsed.data.variants.find((variant) => {
      if (variantIds.has(variant.sourceVariantId)) return true;
      variantIds.add(variant.sourceVariantId);
      return false;
    });
    if (duplicateVariant) {
      rejected.push({ source: key, message: "duplicate sourceVariantId within the product" });
      continue;
    }

    seen.add(key);
    valid.push(parsed.data);
  }

  return { valid, rejected };
}
