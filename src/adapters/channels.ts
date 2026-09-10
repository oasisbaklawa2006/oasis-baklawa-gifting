/**
 * SALES CHANNEL / FEED ADAPTER
 *
 * One public-safe catalogue projection feeds every channel. Channels never get
 * a copied catalogue and the site never claims a live sync or a listing id it
 * was not given.
 */

import { products } from "@/data/catalog";
import { siteUrl } from "@/lib/site-url";

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

/** The only product shape any external channel may receive. */
export type ChannelProduct = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink?: string;
  brand: "Oasis Baklawa";
  priceMinor?: number;
  currency?: "INR";
};

export type ChannelId =
  | "google_merchant"
  | "pinterest"
  | "meta_commerce"
  | "amazon"
  | "flipkart"
  | "ondc"
  | "local_marketplace";

export type FeedFormat = "xml" | "tsv" | "csv" | "json";

export interface SalesChannelAdapter {
  readonly channel: ChannelId;
  readonly formats: readonly FeedFormat[];
  /** Builds a feed from the shared projection. Never fabricates fields. */
  build(items: ChannelProduct[], format: FeedFormat): AdapterResult<string>;
  /** Live listing sync; always unavailable until seller credentials exist. */
  sync(items: ChannelProduct[]): Promise<AdapterResult<{ pushed: number }>>;
}

/** Public-safe projection: approved products with a real title, link and image. */
export function channelProjection(): ChannelProduct[] {
  return products
    .filter((product) => !product.isMock && product.images?.[0]?.src)
    .map((product) => ({
      id: product.slug,
      title: product.name,
      description: product.shortDescription || product.description || product.name,
      link: siteUrl(`/product/${product.slug}`),
      ...(product.images[0]?.src ? { imageLink: product.images[0].src } : {}),
      brand: "Oasis Baklawa" as const,
      ...(typeof product.variants[0]?.price?.amount === "number" &&
      product.variants[0]?.price?.currency === "INR"
        ? { priceMinor: product.variants[0].price.amount, currency: "INR" as const }
        : {}),
    }));
}

function jsonChannel(channel: ChannelId, env: readonly string[]): SalesChannelAdapter {
  return {
    channel,
    formats: ["json", "csv"],
    build(items, format) {
      if (format === "json") {
        return { ok: true, provider: channel, data: JSON.stringify(items, null, 2) };
      }
      if (format === "csv") {
        const header = "id,title,description,link,image_link,brand";
        const rows = items.map((item) =>
          [item.id, item.title, item.description, item.link, item.imageLink ?? "", item.brand]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        );
        return { ok: true, provider: channel, data: [header, ...rows].join("\n") };
      }
      return {
        ok: false,
        provider: channel,
        reason: "unsupported",
        detail: `No ${format} export.`,
      };
    },
    async sync() {
      return notConfigured<{ pushed: number }>(
        channel,
        `Live sync for ${channel} is not configured. Required: ${env.join(", ")}.`,
      );
    },
  };
}

const CHANNELS: Array<[ChannelId, string, readonly string[]]> = [
  ["meta_commerce", "Meta Commerce catalogue", ["META_CATALOG_ID", "META_SYSTEM_USER_TOKEN"]],
  ["amazon", "Amazon seller catalogue export", ["AMAZON_SELLER_ID", "AMAZON_SP_API_TOKEN"]],
  ["flipkart", "Flipkart seller catalogue export", ["FLIPKART_SELLER_ID", "FLIPKART_API_TOKEN"]],
  ["ondc", "ONDC catalogue / order boundary", ["ONDC_SUBSCRIBER_ID", "ONDC_SIGNING_KEY"]],
  ["local_marketplace", "Local marketplace link slot", ["LOCAL_MARKETPLACE_FEED_URL"]],
];

const adapters = new Map<ChannelId, SalesChannelAdapter>();
for (const [channel, label, env] of CHANNELS) {
  adapters.set(channel, jsonChannel(channel, env));
  registerAdapter({
    id: `sales-channel:${channel}`,
    domain: "sales-channel",
    provider: channel,
    label,
    capabilities: ["feed-export", "public-projection"],
    requiredEnv: env,
    fallback: "Export files can be generated on request; no live listing sync is claimed.",
  });
}

registerAdapter({
  id: "sales-channel:google_merchant",
  domain: "sales-channel",
  provider: "google_merchant",
  label: "Google Merchant Center (feed live)",
  capabilities: ["feed-export", "xml", "tsv"],
  requiredEnv: [],
  fallback: "The /feed/products.xml and .tsv endpoints already serve the approved projection.",
  isFallback: true,
});

export function channelAdapter(channel: ChannelId): SalesChannelAdapter | undefined {
  return adapters.get(channel);
}

export function selectedChannel(): string {
  return resolveAdapter("sales-channel")?.provider ?? "google_merchant";
}
