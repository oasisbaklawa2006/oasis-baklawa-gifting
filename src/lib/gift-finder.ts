/**
 * GIFT FINDER — deterministic, local recommendation engine.
 *
 * Scores approved catalogue products against an occasion / recipient / budget /
 * preference brief. No AI service and no network call: the interface is shaped
 * so a future governed enrichment service can replace `scoreProduct` without
 * touching the UI. Unapproved placeholder records are never recommended.
 */

import { products } from "@/data/catalog";
import type { Product } from "@/data/types";

export type OccasionKey =
  "festive" | "wedding" | "corporate" | "baby-family" | "personal" | "premium";

export type RecipientKey = "family" | "friend" | "colleague" | "client" | "host" | "couple";

export type BudgetKey = "under-1500" | "1500-3000" | "3000-6000" | "6000-plus";

export type PreferenceKey = "baklawa" | "dates" | "chocolate" | "assorted" | "nuts";

export type GiftBrief = {
  occasion?: OccasionKey;
  recipient?: RecipientKey;
  budget?: BudgetKey;
  preference?: PreferenceKey;
  /** Only claims Oasis has verified on a product can be filtered on. */
  requiredClaims?: string[];
};

export const OCCASIONS: { key: OccasionKey; label: string }[] = [
  { key: "festive", label: "Festival" },
  { key: "wedding", label: "Wedding" },
  { key: "corporate", label: "Corporate" },
  { key: "baby-family", label: "Baby & family" },
  { key: "personal", label: "Birthday & personal" },
  { key: "premium", label: "Milestone & premium" },
];

export const RECIPIENTS: { key: RecipientKey; label: string }[] = [
  { key: "family", label: "Family" },
  { key: "friend", label: "A friend" },
  { key: "colleague", label: "A colleague" },
  { key: "client", label: "A client" },
  { key: "host", label: "A host" },
  { key: "couple", label: "A couple" },
];

export const BUDGETS: { key: BudgetKey; label: string; min: number; max: number }[] = [
  { key: "under-1500", label: "Up to ₹1,500", min: 0, max: 1500 },
  { key: "1500-3000", label: "₹1,500 – ₹3,000", min: 1500, max: 3000 },
  { key: "3000-6000", label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { key: "6000-plus", label: "₹6,000 and above", min: 6000, max: Number.POSITIVE_INFINITY },
];

export const PREFERENCES: { key: PreferenceKey; label: string; match: string[] }[] = [
  { key: "baklawa", label: "Baklawa", match: ["baklawa", "kataifi", "ma'amoul"] },
  { key: "dates", label: "Arabic dates", match: ["date", "chocodate", "tamaar", "tomoor"] },
  { key: "chocolate", label: "Chocolates", match: ["chocolate", "praline", "ganache", "dragee"] },
  { key: "assorted", label: "An assortment", match: ["assort", "gift", "hamper", "selection"] },
  {
    key: "nuts",
    label: "Nuts & dry fruit",
    match: ["nut", "pistachio", "cashew", "almond", "mix"],
  },
];

const OCCASION_WORDS: Record<OccasionKey, string[]> = {
  festive: ["festive", "diwali", "eid", "christmas"],
  wedding: ["wedding", "trousseau", "celebration"],
  corporate: ["corporate", "client", "office"],
  "baby-family": ["family", "baby", "celebration"],
  personal: ["thank you", "birthday", "everyday", "hosting"],
  premium: ["premium", "milestone", "signature"],
};

const RECIPIENT_WORDS: Record<RecipientKey, string[]> = {
  family: ["family", "festive", "hosting"],
  friend: ["thank you", "everyday", "hosting"],
  colleague: ["corporate", "office", "thank you"],
  client: ["corporate", "client", "premium"],
  host: ["hosting", "thank you"],
  couple: ["wedding", "celebration", "premium"],
};

/** Lowest variant price, used for budget banding. */
export function entryPrice(product: Product): number {
  return product.variants.reduce(
    (min, variant) => Math.min(min, variant.price.amount),
    Number.POSITIVE_INFINITY,
  );
}

function haystack(product: Product): string {
  return [
    product.name,
    product.categoryCue,
    product.shortDescription,
    ...product.occasions,
    ...product.badges,
  ]
    .join(" ")
    .toLowerCase();
}

export function scoreProduct(product: Product, brief: GiftBrief): number {
  const text = haystack(product);
  let score = 0;

  if (brief.occasion) {
    const hits = OCCASION_WORDS[brief.occasion].filter((word) => text.includes(word)).length;
    score += hits * 3;
  }
  if (brief.recipient) {
    const hits = RECIPIENT_WORDS[brief.recipient].filter((word) => text.includes(word)).length;
    score += hits * 2;
  }
  if (brief.preference) {
    const pref = PREFERENCES.find((p) => p.key === brief.preference);
    if (pref?.match.some((word) => text.includes(word))) score += 4;
  }
  if (brief.budget) {
    const band = BUDGETS.find((b) => b.key === brief.budget);
    const price = entryPrice(product);
    if (band && price >= band.min && price <= band.max) score += 4;
    else if (band && price < band.min) score += 1;
  }
  if (product.badges.includes("gifting")) score += 2;
  if (product.badges.includes("bestseller")) score += 1;

  return score;
}

export type GiftRecommendation = { product: Product; score: number };

/** Eligible = approved (not placeholder), purchasable, and claim-compatible. */
export function eligibleProducts(brief: GiftBrief): Product[] {
  return products.filter((product) => {
    if (product.isMock) return false;
    if (product.variants.length === 0) return false;
    if (brief.requiredClaims?.length) {
      const claims = (product.verifiedClaims ?? []).map((c) => c.toLowerCase());
      if (!brief.requiredClaims.every((claim) => claims.includes(claim.toLowerCase())))
        return false;
    }
    return true;
  });
}

export function recommendGifts(brief: GiftBrief, limit = 6): GiftRecommendation[] {
  return eligibleProducts(brief)
    .map((product) => ({ product, score: scoreProduct(product, brief) }))
    .sort((a, b) => b.score - a.score || a.product.name.localeCompare(b.product.name))
    .slice(0, limit);
}

/* -------- URL state so a brief can be shared or bookmarked -------- */

export function briefToSearch(brief: GiftBrief): Record<string, string> {
  const out: Record<string, string> = {};
  if (brief.occasion) out["occasion"] = brief.occasion;
  if (brief.recipient) out["recipient"] = brief.recipient;
  if (brief.budget) out["budget"] = brief.budget;
  if (brief.preference) out["preference"] = brief.preference;
  return out;
}

export function briefFromSearch(search: Record<string, unknown>): GiftBrief {
  const pick = <T extends string>(key: string, allowed: readonly T[]): T | undefined => {
    const value = String(search[key] ?? "");
    return allowed.includes(value as T) ? (value as T) : undefined;
  };
  const brief: GiftBrief = {};
  const occasion = pick(
    "occasion",
    OCCASIONS.map((o) => o.key),
  );
  const recipient = pick(
    "recipient",
    RECIPIENTS.map((r) => r.key),
  );
  const budget = pick(
    "budget",
    BUDGETS.map((b) => b.key),
  );
  const preference = pick(
    "preference",
    PREFERENCES.map((p) => p.key),
  );
  if (occasion) brief.occasion = occasion;
  if (recipient) brief.recipient = recipient;
  if (budget) brief.budget = budget;
  if (preference) brief.preference = preference;
  return brief;
}
