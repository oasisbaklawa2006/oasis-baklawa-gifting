/**
 * Server-only Oasis Core CONNECT-2 catalogue reader.
 *
 * This does not authorize a purchase, price, stock promise or checkout.
 * A least-privilege website_retail_v1 token is issued by Core governance,
 * never minted here or embedded in a VITE_* environment variable.
 */
import { z } from "zod";

const RESOURCE = "catalogue.products";
const PROFILE = "website_retail_v1";
const MAX_LIMIT = 100;

const FIELDS = [
  "product_id",
  "sku",
  "product_name",
  "short_description",
  "long_description",
  "category",
  "subcategory",
  "hero_image_url",
  "pack_size",
  "primary_uom",
] as const;
const allowedFields = new Set<string>(FIELDS);

export type CoreCatalogueProduct = {
  productId: string;
  name: string;
  sku?: string;
  shortDescription?: string;
  longDescription?: string;
  category?: string;
  subcategory?: string;
  heroImageUrl?: string;
  packSize?: string;
  primaryUom?: string;
};

export type CoreCataloguePage =
  | {
      status: "available";
      products: CoreCatalogueProduct[];
      count: number;
      limit: number;
      offset: number;
      source: "core-connect2";
    }
  | { status: "unavailable"; reason: string };

type CoreEnv = Record<string, string | undefined>;
const envelopeSchema = z.object({
  ok: z.literal(true),
  resource: z.literal(RESOURCE),
  profile_key: z.literal(PROFILE),
  consumer_key: z.string().min(1),
  environment: z.enum(["production", "staging", "preview"]),
  contract_version: z.literal(1),
  row_count: z.number().int().min(0).max(MAX_LIMIT),
  data: z.array(z.record(z.string(), z.unknown())).max(MAX_LIMIT),
});

function optionalString(row: Record<string, unknown>, key: string): string | undefined {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function projectWebsiteProduct(row: Record<string, unknown>): CoreCatalogueProduct | null {
  if (Object.keys(row).some((key) => !allowedFields.has(key))) return null;
  const id = z.string().uuid().safeParse(row["product_id"]);
  const name = z.string().min(1).safeParse(row["product_name"]);
  if (!id.success || !name.success) return null;
  const product: CoreCatalogueProduct = { productId: id.data, name: name.data };
  const sku = optionalString(row, "sku");
  const shortDescription = optionalString(row, "short_description");
  const longDescription = optionalString(row, "long_description");
  const category = optionalString(row, "category");
  const subcategory = optionalString(row, "subcategory");
  const heroImageUrl = optionalString(row, "hero_image_url");
  const packSize = optionalString(row, "pack_size");
  const primaryUom = optionalString(row, "primary_uom");
  if (sku) product.sku = sku;
  if (shortDescription) product.shortDescription = shortDescription;
  if (longDescription) product.longDescription = longDescription;
  if (category) product.category = category;
  if (subcategory) product.subcategory = subcategory;
  if (heroImageUrl) product.heroImageUrl = heroImageUrl;
  if (packSize) product.packSize = packSize;
  if (primaryUom) product.primaryUom = primaryUom;
  return product;
}

export async function readCoreCataloguePage(
  page: { limit?: number; offset?: number } = {},
  env: CoreEnv = process.env,
  transport: typeof fetch = fetch,
): Promise<CoreCataloguePage> {
  const urlText = env["OASIS_CORE_SUPABASE_URL"];
  const publicKey = env["OASIS_CORE_PUBLISHABLE_KEY"];
  const token = env["OASIS_CORE_CONNECT_TOKEN"];
  const consumerKey = env["OASIS_CORE_CONNECT_CONSUMER_KEY"];
  const environment = env["OASIS_CORE_CONNECT_ENV"];
  if (!urlText || !publicKey || !token || token.length < 32 || !consumerKey || !environment) {
    return {
      status: "unavailable",
      reason: "A governed Core consumer identity is not configured.",
    };
  }

  const limit = page.limit ?? 50;
  const offset = page.offset ?? 0;
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_LIMIT ||
    !Number.isInteger(offset) ||
    offset < 0 ||
    offset > 100_000
  ) {
    return { status: "unavailable", reason: "Invalid catalogue pagination." };
  }

  let endpoint: URL;
  try {
    const base = new URL(urlText);
    if (
      base.protocol !== "https:" ||
      base.username ||
      base.password ||
      base.pathname !== "/" ||
      base.search ||
      base.hash
    ) {
      throw new Error("Invalid backend origin");
    }
    endpoint = new URL("/rest/v1/rpc/connect_authorize_and_project_v1", base);
  } catch {
    return { status: "unavailable", reason: "Core endpoint configuration is invalid." };
  }

  const headers: Record<string, string> = {
    apikey: publicKey,
    "content-type": "application/json",
    accept: "application/json",
  };
  // Legacy Supabase anon keys are public JWTs; new sb_publishable keys are opaque.
  if (publicKey.split(".").length === 3) headers["authorization"] = `Bearer ${publicKey}`;

  try {
    const response = await transport(endpoint.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify({
        p_token: token,
        p_resource: RESOURCE,
        p_params: { fields: FIELDS, limit, offset },
      }),
      signal: AbortSignal.timeout(8_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        status: "unavailable",
        reason: `Core rejected catalogue projection (${response.status}).`,
      };
    }
    const parsed = envelopeSchema.safeParse(await response.json());
    if (
      !parsed.success ||
      parsed.data.row_count !== parsed.data.data.length ||
      parsed.data.consumer_key !== consumerKey ||
      parsed.data.environment !== environment
    ) {
      return {
        status: "unavailable",
        reason: "Core catalogue response failed contract validation.",
      };
    }

    const products: CoreCatalogueProduct[] = [];
    for (const row of parsed.data.data) {
      const product = projectWebsiteProduct(row);
      if (!product) {
        return {
          status: "unavailable",
          reason: "Core catalogue response contains invalid or unauthorized fields.",
        };
      }
      products.push(product);
    }
    return {
      status: "available",
      products,
      count: products.length,
      limit,
      offset,
      source: "core-connect2",
    };
  } catch {
    // Never log connector tokens, returned product rows or provider error payloads.
    return { status: "unavailable", reason: "Core catalogue projection is currently unavailable." };
  }
}
