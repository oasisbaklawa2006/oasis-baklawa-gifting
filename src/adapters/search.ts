/**
 * SEARCH ADAPTER
 *
 * The local catalogue search always works and is the fallback. Remote engines
 * are optional accelerators; when unconfigured they cleanly hand back to local
 * results. Results may only ever contain approved Oasis products.
 */

import { products } from "@/data/catalog";
import type { Product } from "@/data/types";

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type SearchQuery = {
  term: string;
  department?: string;
  facets?: Record<string, string[]>;
  limit?: number;
};

export type SearchHit = { slug: string; title: string; department?: string };

export type SearchResponse = {
  hits: SearchHit[];
  total: number;
  facets: Record<string, Record<string, number>>;
  provider: string;
};

export interface SearchAdapter {
  readonly provider: string;
  search(query: SearchQuery): Promise<AdapterResult<SearchResponse>>;
  autocomplete(term: string, limit?: number): Promise<AdapterResult<string[]>>;
  /** Index sync contract; a no-op locally because the catalogue is the index. */
  syncIndex(items: Product[]): Promise<AdapterResult<{ indexed: number }>>;
}

function matches(product: Product, term: string): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return false;
  return [product.name, product.shortDescription, product.description, product.categoryId]
    .filter(Boolean)
    .some((field) => String(field).toLowerCase().includes(needle));
}

export function localSearch(query: SearchQuery): SearchResponse {
  const list = products.filter((product) => matches(product, query.term));
  const scoped = query.department
    ? list.filter((product) => product.collectionIds.includes(query.department!))
    : list;
  const facets: Record<string, Record<string, number>> = { category: {} };
  for (const product of scoped) {
    const bucket = facets["category"]!;
    bucket[product.categoryId] = (bucket[product.categoryId] ?? 0) + 1;
  }
  return {
    hits: scoped.slice(0, query.limit ?? 24).map((product) => ({
      slug: product.slug,
      title: product.name,
      department: product.categoryId,
    })),
    total: scoped.length,
    facets,
    provider: "local",
  };
}

export const localSearchAdapter: SearchAdapter = {
  provider: "local",
  async search(query) {
    return { ok: true, provider: "local", data: localSearch(query) };
  },
  async autocomplete(term, limit = 6) {
    return {
      ok: true,
      provider: "local",
      data: localSearch({ term, limit }).hits.map((hit) => hit.title),
    };
  },
  async syncIndex(items) {
    return { ok: true, provider: "local", data: { indexed: items.length } };
  },
};

function remoteBoundary(provider: string, label: string, env: readonly string[]): SearchAdapter {
  const detail = `${label} is not configured. Required: ${env.join(", ")}.`;
  return {
    provider,
    async search() {
      return notConfigured<SearchResponse>(provider, detail);
    },
    async autocomplete() {
      return notConfigured<string[]>(provider, detail);
    },
    async syncIndex() {
      return notConfigured<{ indexed: number }>(provider, detail);
    },
  };
}

const boundaries: Record<string, SearchAdapter> = {
  algolia: remoteBoundary("algolia", "Algolia", ["ALGOLIA_APP_ID", "ALGOLIA_ADMIN_KEY"]),
  typesense: remoteBoundary("typesense", "Typesense", ["TYPESENSE_HOST", "TYPESENSE_API_KEY"]),
  meilisearch: remoteBoundary("meilisearch", "Meilisearch", [
    "MEILISEARCH_HOST",
    "MEILISEARCH_API_KEY",
  ]),
};

registerAdapter({
  id: "search:local",
  domain: "search",
  provider: "local",
  label: "Local catalogue search",
  capabilities: ["query", "autocomplete", "facets", "department-scope"],
  requiredEnv: [],
  fallback: "Always available and always used when a remote engine is missing or failing.",
  isFallback: true,
});

const remoteCaps = [
  "query",
  "autocomplete",
  "typo-tolerance",
  "facets",
  "merchandising-boosts",
  "index-sync",
] as const;

registerAdapter({
  id: "search:algolia",
  domain: "search",
  provider: "algolia",
  label: "Algolia",
  capabilities: remoteCaps,
  requiredEnv: ["ALGOLIA_APP_ID", "ALGOLIA_ADMIN_KEY"],
  fallback: "Local catalogue search.",
});
registerAdapter({
  id: "search:typesense",
  domain: "search",
  provider: "typesense",
  label: "Typesense",
  capabilities: remoteCaps,
  requiredEnv: ["TYPESENSE_HOST", "TYPESENSE_API_KEY"],
  fallback: "Local catalogue search.",
});
registerAdapter({
  id: "search:meilisearch",
  domain: "search",
  provider: "meilisearch",
  label: "Meilisearch",
  capabilities: remoteCaps,
  requiredEnv: ["MEILISEARCH_HOST", "MEILISEARCH_API_KEY"],
  fallback: "Local catalogue search.",
});

export function searchAdapter(): SearchAdapter {
  const descriptor = resolveAdapter("search");
  if (!descriptor || descriptor.provider === "local") return localSearchAdapter;
  return boundaries[descriptor.provider] ?? localSearchAdapter;
}

/** Search that can never fail: a remote miss silently returns local results. */
export async function runSearch(query: SearchQuery): Promise<SearchResponse> {
  const adapter = searchAdapter();
  const result = await adapter.search(query);
  return result.ok ? result.data : localSearch(query);
}
