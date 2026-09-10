/**
 * REVIEWS / UGC ADAPTER
 *
 * The site never generates a review, a score, a count or a star. With no
 * verified source configured, every review surface stays hidden. Providers
 * supply verified reviews later through one normalised model.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type ReviewStatus = "pending" | "published" | "rejected";

export type NormalizedReview = {
  id: string;
  source: string;
  subject: { kind: "product" | "store"; id: string };
  rating: number;
  title?: string;
  body: string;
  authorDisplayName: string;
  verifiedPurchase: boolean;
  status: ReviewStatus;
  submittedAt: string;
};

export type ReviewSummary = { count: number; average: number } | null;

export interface ReviewsAdapter {
  readonly provider: string;
  /** Null summary means "no verified data" — the UI must render nothing. */
  summary(subjectId: string): Promise<AdapterResult<ReviewSummary>>;
  list(subjectId: string): Promise<AdapterResult<NormalizedReview[]>>;
  /** Triggered only after Appverse confirms delivery. */
  requestReview(input: {
    orderReference: string;
    productIds: string[];
  }): Promise<AdapterResult<{ requested: boolean }>>;
  normalizeWebhook(payload: unknown): NormalizedReview | null;
}

export const noReviews: ReviewsAdapter = {
  provider: "none",
  async summary() {
    return { ok: true, provider: "none", data: null };
  },
  async list() {
    return { ok: true, provider: "none", data: [] };
  },
  async requestReview() {
    return notConfigured<{ requested: boolean }>(
      "none",
      "No review provider is configured, so review requests are not sent.",
    );
  },
  normalizeWebhook: () => null,
};

function boundary(provider: string, label: string, env: readonly string[]): ReviewsAdapter {
  const detail = `${label} is not configured. Required: ${env.join(", ")}.`;
  return {
    ...noReviews,
    provider,
    async summary() {
      return notConfigured<ReviewSummary>(provider, detail);
    },
    async list() {
      return notConfigured<NormalizedReview[]>(provider, detail);
    },
  };
}

const boundaries: Record<string, ReviewsAdapter> = {
  judgeme: boundary("judgeme", "Judge.me", ["JUDGEME_API_TOKEN", "JUDGEME_SHOP_DOMAIN"]),
  yotpo: boundary("yotpo", "Yotpo", ["YOTPO_APP_KEY", "YOTPO_API_SECRET"]),
  google: boundary("google", "Google reviews", ["GOOGLE_BUSINESS_ACCOUNT_ID"]),
};

registerAdapter({
  id: "reviews:none",
  domain: "reviews",
  provider: "none",
  label: "No verified review source",
  capabilities: ["hide-review-ui"],
  requiredEnv: [],
  fallback: "Review UI stays hidden. No ratings, counts or stars are shown anywhere.",
  isFallback: true,
});

for (const [provider, label, env] of [
  ["judgeme", "Judge.me", ["JUDGEME_API_TOKEN", "JUDGEME_SHOP_DOMAIN"]],
  ["yotpo", "Yotpo", ["YOTPO_APP_KEY", "YOTPO_API_SECRET"]],
  ["google", "Google Business reviews", ["GOOGLE_BUSINESS_ACCOUNT_ID"]],
] as const) {
  registerAdapter({
    id: `reviews:${provider}`,
    domain: "reviews",
    provider,
    label,
    capabilities: ["verified-reviews", "moderation-status", "review-request", "webhook"],
    requiredEnv: env,
    fallback: "Review UI stays hidden.",
  });
}

export function reviewsAdapter(): ReviewsAdapter {
  const descriptor = resolveAdapter("reviews");
  if (!descriptor || descriptor.provider === "none") return noReviews;
  return boundaries[descriptor.provider] ?? noReviews;
}

/** True only when a provider returned verified data. */
export async function hasVerifiedReviews(subjectId: string): Promise<boolean> {
  const result = await reviewsAdapter().summary(subjectId);
  return result.ok && result.data !== null && result.data.count > 0;
}
