/**
 * Content model for the Oasis Baklawa platform.
 * These types are intentionally source-agnostic: the mock modules in
 * `src/data/*` can be swapped for API/CMS responses without touching the UI.
 */

export type Money = {
  /** Amount in major currency units (mock data only). */
  amount: number;
  currency: "INR" | "AED" | "USD";
};

export type ProductBadge = "signature" | "new" | "bestseller" | "gifting" | "seasonal";

export type ProductVariant = {
  id: string;
  /** e.g. "500 g", "Box of 12" */
  label: string;
  price: Money;
  compareAtPrice?: Money;
  availability: "in-stock" | "made-to-order" | "low-stock";
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  /** Short category cue shown under the product name on cards. */
  categoryCue: string;
  categoryId: string;
  collectionIds: string[];
  shortDescription: string;
  description: string;
  story?: string;
  ingredients: string[];
  allergens: string[];
  storage: string;
  shelfLife: string;
  leadTime: string;
  occasions: string[];
  dietary: string[];
  badges: ProductBadge[];
  /** Only claims verified by Oasis are rendered as badges (Halal, dietary, etc.). */
  verifiedClaims?: string[];
  /** True while the record is placeholder data awaiting the governed catalogue. */
  isMock?: boolean;
  variants: ProductVariant[];
  images: { src: string; alt: string }[];
  details: { label: string; value: string }[];
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: { src: string; alt: string };
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  description: string;
  image: { src: string; alt: string };
};

export type Store = {
  id: string;
  name: string;
  city: string;
  region: string;
  addressLines: string[];
  postalCode?: string;
  hours?: string;
  phone?: string;
  services: string[];
  status: "open" | "opening-soon";
};

export type Testimonial = {
  id: string;
  quote: string;
  attribution: string;
  context: string;
};

export type NavigationItem = {
  label: string;
  to: string;
  description?: string;
  children?: { label: string; to: string; description?: string }[];
  columns?: { title: string; items: { label: string; to: string }[] }[];
};

export type CorporateCapability = {
  id: string;
  title: string;
  summary: string;
  points: string[];
};

export type GiftingOccasion = {
  id: string;
  slug: string;
  group: "corporate" | "wedding" | "festival" | "baby-family" | "personal" | "premium";
  title: string;
  summary: string;
  examples: string[];
};

export type GiftBoxFormat = {
  id: string;
  name: string;
  format: "box" | "chest";
  capacity: 9 | 16 | 25 | 36;
  basePrice: Money;
  description: string;
};

export type GiftFinish = {
  id: string;
  label: string;
  /** Mock surcharge in major units. */
  surcharge: number;
};
