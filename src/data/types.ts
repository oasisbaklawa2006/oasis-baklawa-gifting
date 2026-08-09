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
  hours: string;
  phone: string;
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
