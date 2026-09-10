/**
 * RECOMMENDATION / GIFT ASSISTANT ADAPTER
 *
 * The deterministic local gift-finder scoring is the fallback and the safety
 * net: every recommendation from any provider is validated against the
 * approved catalogue before it can be displayed. Unknown or unapproved
 * product ids are dropped, and no provider may introduce product facts.
 */

import { products } from "@/data/catalog";
import { recommendGifts, type GiftBrief } from "@/lib/gift-finder";

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type RecommendationContext = GiftBrief & {
  /** Only sent when analytics consent was granted. */
  recentlyViewedSlugs?: string[];
};

export type Recommendation = { slug: string; reason?: string };

export interface RecommendationAdapter {
  readonly provider: string;
  recommend(
    context: RecommendationContext,
    limit?: number,
  ): Promise<AdapterResult<Recommendation[]>>;
}

const approvedSlugs = () => new Set(products.map((product) => product.slug));

/** Drops anything that is not an approved catalogue product. */
export function validateRecommendations(list: Recommendation[]): Recommendation[] {
  const approved = approvedSlugs();
  const seen = new Set<string>();
  return list.filter((item) => {
    if (!approved.has(item.slug) || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

export const localRecommendations: RecommendationAdapter = {
  provider: "local",
  async recommend(context, limit = 6) {
    const list = recommendGifts(context, limit).map((entry) => ({ slug: entry.product.slug }));
    return { ok: true, provider: "local", data: validateRecommendations(list) };
  },
};

const aiBoundary: RecommendationAdapter = {
  provider: "ai",
  async recommend() {
    return notConfigured<Recommendation[]>(
      "ai",
      "No recommendation provider is configured. Required: AI_RECOMMENDER_URL, AI_RECOMMENDER_KEY.",
    );
  },
};

registerAdapter({
  id: "recommendations:local",
  domain: "recommendations",
  provider: "local",
  label: "Deterministic gift scoring",
  capabilities: ["occasion", "recipient", "budget", "verified-dietary", "related-products"],
  requiredEnv: [],
  fallback: "Always available; the same rules power Gift Finder today.",
  isFallback: true,
});

registerAdapter({
  id: "recommendations:ai",
  domain: "recommendations",
  provider: "ai",
  label: "AI recommender (optional)",
  capabilities: ["ranking", "personalisation", "assistant-conversation"],
  requiredEnv: ["AI_RECOMMENDER_URL", "AI_RECOMMENDER_KEY"],
  fallback: "Deterministic gift scoring. Output is validated against the approved catalogue.",
});

export function recommendationAdapter(): RecommendationAdapter {
  const descriptor = resolveAdapter("recommendations");
  return descriptor?.provider === "ai" ? aiBoundary : localRecommendations;
}

/** Always returns approved products; falls back silently when a provider fails. */
export async function recommend(
  context: RecommendationContext,
  limit = 6,
): Promise<Recommendation[]> {
  const result = await recommendationAdapter().recommend(context, limit);
  if (!result.ok)
    return (await localRecommendations.recommend(context, limit)).ok
      ? validateRecommendations(
          recommendGifts(context, limit).map((entry) => ({ slug: entry.product.slug })),
        )
      : [];
  return validateRecommendations(result.data).slice(0, limit);
}
