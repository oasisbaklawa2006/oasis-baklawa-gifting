/**
 * GOOGLE MERCHANT CENTER / SHOPPING FEED BUILDER
 *
 * Public-safe, approved products only. A product is included only when every
 * required attribute is verifiably present in the governed catalogue; anything
 * else is excluded and reported in the diagnostics report rather than
 * published with an invented value.
 *
 * The same item set is reused for Pinterest catalogue ingestion, which accepts
 * the Google product feed schema.
 */

import { products } from "@/data/catalog";
import type { Product, ProductVariant } from "@/data/types";
import { siteUrl } from "@/lib/site-url";

export type FeedItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink?: string;
  additionalImageLinks: string[];
  price?: { amount: number; currency: string };
  availability?: "in_stock" | "out_of_stock";
  brand: string;
  condition: "new";
  gtin?: string;
  mpn?: string;
  productType?: string;
  googleProductCategory?: string;
};

export type FeedExclusion = { id: string; title: string; missing: string[] };

export type FeedReport = {
  items: FeedItem[];
  excluded: FeedExclusion[];
  generatedAt: string;
};

const BRAND = "Oasis Baklawa";

/** Only categories with a safe, unambiguous Google taxonomy mapping. */
const GOOGLE_CATEGORY: Record<string, string> = {
  "cat-baklawa": "Food, Beverages & Tobacco > Food Items > Bakery > Desserts",
  "cat-pistachio": "Food, Beverages & Tobacco > Food Items > Bakery > Desserts",
  "cat-assortments": "Food, Beverages & Tobacco > Food Items > Bakery > Desserts",
  "cat-chocolates": "Food, Beverages & Tobacco > Food Items > Candy & Chocolate",
  "cat-dates": "Food, Beverages & Tobacco > Food Items > Fruits & Vegetables",
  "cat-nuts": "Food, Beverages & Tobacco > Food Items > Nuts & Seeds",
  "cat-turkish": "Food, Beverages & Tobacco > Food Items > Candy & Chocolate",
};

function absolute(url: string | undefined, requestUrl?: string): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  const built = siteUrl(url, requestUrl);
  return /^https?:\/\//i.test(built) ? built : undefined;
}

function productImages(product: Product): string[] {
  return [...new Set(product.images.map((image) => image.src).filter(Boolean))];
}

function variantIdentifiers(variant: ProductVariant): { gtin?: string; mpn?: string } {
  const record = variant as unknown as { gtin?: string; sku?: string; mpn?: string };
  return {
    ...(record.gtin ? { gtin: record.gtin } : {}),
    ...(record.mpn ?? record.sku ? { mpn: record.mpn ?? record.sku } : {}),
  };
}

/** Builds the feed and the exclusion diagnostics in one pass. */
export function buildFeed(requestUrl?: string, now = new Date()): FeedReport {
  const items: FeedItem[] = [];
  const excluded: FeedExclusion[] = [];

  for (const product of products) {
    const missing: string[] = [];
    if (product.isMock) missing.push("approved catalogue record (isMock)");

    const variant = product.variants[0];
    if (!variant) missing.push("variant");

    const description = product.shortDescription?.trim();
    if (!description) missing.push("description");

    const link = absolute(`/product/${product.slug}`, requestUrl);
    if (!link) missing.push("absolute product URL (VITE_SITE_URL)");

    const images = productImages(product)
      .map((src) => absolute(src, requestUrl))
      .filter((src): src is string => Boolean(src));
    if (images.length === 0) missing.push("image_link");

    const price = variant?.price;
    if (!price || !(price.amount > 0)) missing.push("current governed price");

    if (missing.length || !variant || !link || !description || !price) {
      excluded.push({ id: variant?.id ?? product.id, title: product.name, missing });
      continue;
    }

    const [primary, ...rest] = images;
    const identifiers = variantIdentifiers(variant);
    const googleCategory = GOOGLE_CATEGORY[product.categoryId];

    items.push({
      id: variant.id,
      title: product.name,
      description,
      link,
      ...(primary ? { imageLink: primary } : {}),
      additionalImageLinks: rest.slice(0, 10),
      price: { amount: price.amount, currency: price.currency },
      brand: BRAND,
      condition: "new",
      ...identifiers,
      ...(product.categoryId ? { productType: product.categoryId } : {}),
      // Availability comes from the governed catalogue record only.
      ...(variant.availability === "in-stock" || variant.availability === "low-stock"
        ? { availability: "in_stock" as const }
        : {}),
      ...(googleCategory ? { googleProductCategory: googleCategory } : {}),
    });
  }

  return { items, excluded, generatedAt: now.toISOString() };
}

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function feedToXml(report: FeedReport, requestUrl?: string): string {
  const entries = report.items.map((item) => {
    const lines = [
      `      <g:id>${escapeXml(item.id)}</g:id>`,
      `      <g:title>${escapeXml(item.title)}</g:title>`,
      `      <g:description>${escapeXml(item.description)}</g:description>`,
      `      <g:link>${escapeXml(item.link)}</g:link>`,
      item.imageLink ? `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>` : "",
      ...item.additionalImageLinks.map(
        (src) => `      <g:additional_image_link>${escapeXml(src)}</g:additional_image_link>`,
      ),
      item.price
        ? `      <g:price>${item.price.amount} ${escapeXml(item.price.currency)}</g:price>`
        : "",
      item.availability ? `      <g:availability>${item.availability}</g:availability>` : "",
      `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
      `      <g:condition>${item.condition}</g:condition>`,
      item.gtin ? `      <g:gtin>${escapeXml(item.gtin)}</g:gtin>` : "",
      item.mpn ? `      <g:mpn>${escapeXml(item.mpn)}</g:mpn>` : "",
      item.productType ? `      <g:product_type>${escapeXml(item.productType)}</g:product_type>` : "",
      item.googleProductCategory
        ? `      <g:google_product_category>${escapeXml(item.googleProductCategory)}</g:google_product_category>`
        : "",
    ].filter(Boolean);
    return `    <item>\n${lines.join("\n")}\n    </item>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Oasis Baklawa</title>
    <link>${escapeXml(siteUrl("/", requestUrl))}</link>
    <description>Approved Oasis Baklawa products</description>
${entries.join("\n")}
  </channel>
</rss>`;
}

const TSV_COLUMNS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "additional_image_link",
  "price",
  "brand",
  "condition",
  "gtin",
  "mpn",
  "product_type",
  "google_product_category",
] as const;

export function feedToTsv(report: FeedReport): string {
  const rows = report.items.map((item) =>
    [
      item.id,
      item.title,
      item.description,
      item.link,
      item.imageLink ?? "",
      item.additionalImageLinks.join(","),
      item.price ? `${item.price.amount} ${item.price.currency}` : "",
      item.brand,
      item.condition,
      item.gtin ?? "",
      item.mpn ?? "",
      item.productType ?? "",
      item.googleProductCategory ?? "",
    ]
      .map((cell) => String(cell).replace(/[\t\r\n]+/g, " "))
      .join("\t"),
  );
  return [TSV_COLUMNS.join("\t"), ...rows].join("\n");
}

/** Aggregated diagnostics for the private admin surface. */
export function feedDiagnostics(requestUrl?: string) {
  const report = buildFeed(requestUrl);
  const missingCounts: Record<string, number> = {};
  for (const item of report.excluded) {
    for (const reason of item.missing) missingCounts[reason] = (missingCounts[reason] ?? 0) + 1;
  }
  return {
    eligible: report.items.length,
    excluded: report.excluded.length,
    missingCounts,
    generatedAt: report.generatedAt,
    sampleExclusions: report.excluded.slice(0, 10),
  };
}
