import { categoriesAll, products as allProducts } from "@/data/catalog";
import { departments, type DepartmentId } from "@/data/departments";
import type { Product } from "@/data/types";

/**
 * One filter engine for every product surface: department landing pages,
 * Shop All, and mega-menu deep links. Facets are derived from real product
 * records, so a filter is only ever offered when products can satisfy it.
 */

export type CatalogSearch = {
  category?: string | undefined;
  collection?: string | undefined;
  occasion?: string | undefined;
  recipient?: string | undefined;
  giftType?: string | undefined;
  ingredient?: string | undefined;
  maxPrice?: number | undefined;
  sort?: string | undefined;
};

export const catalogSearchKeys = [
  "category",
  "collection",
  "occasion",
  "recipient",
  "giftType",
  "ingredient",
] as const;

export function validateCatalogSearch(search: Record<string, unknown>): CatalogSearch {
  const out: CatalogSearch = {};
  for (const key of catalogSearchKeys) {
    const value = search[key];
    if (typeof value === "string" && value) out[key] = value;
  }
  const max = Number(search["maxPrice"]);
  if (Number.isFinite(max) && max > 0) out.maxPrice = max;
  if (typeof search["sort"] === "string" && search["sort"]) out.sort = search["sort"];
  return out;
}

/* ------------------------------ Facets -------------------------------- */

export const recipientOptions = [
  { id: "family-friends", label: "Family & Friends", occasions: ["Festive", "Casual"] },
  { id: "host-thank-you", label: "Host / Thank You", occasions: ["Casual"] },
  { id: "couple-wedding", label: "Couple / Wedding", occasions: ["Wedding", "Mehendi"] },
  { id: "clients-employees", label: "Clients & Employees", occasions: ["Corporate"] },
] as const;

export type RecipientId = (typeof recipientOptions)[number]["id"];

export function recipientsOf(product: Product): string[] {
  return recipientOptions
    .filter((option) => option.occasions.some((o) => product.occasions.includes(o)))
    .map((option) => option.id);
}

const hasWord = (product: Product, word: string) =>
  `${product.name} ${product.categoryCue} ${product.shortDescription}`.toLowerCase().includes(word);

export const giftTypeOptions: { id: string; label: string; match: (p: Product) => boolean }[] = [
  {
    id: "premium-gifting",
    label: "Premium Gifting",
    match: (p) => p.categoryId === "cat-luxury-gifting",
  },
  {
    id: "assortment-gifts",
    label: "Assortment Gifts",
    match: (p) => p.categoryId === "cat-assortments",
  },
  {
    id: "gift-hampers",
    label: "Gift Hampers",
    match: (p) => hasWord(p, "hamper") || p.categoryId === "cat-gifting",
  },
  {
    id: "baklawa-gift-boxes",
    label: "Baklawa Gift Boxes",
    match: (p) =>
      (p.categoryId === "cat-baklawa" || p.categoryId === "cat-pistachio") &&
      (p.collectionIds.includes("col-gifting") || hasWord(p, "box")),
  },
  {
    id: "dates-gifts",
    label: "Dates & Chocodates Gifts",
    match: (p) => p.categoryId === "cat-dates",
  },
  {
    id: "chocolate-gifts",
    label: "Chocolate Gifts",
    match: (p) => p.categoryId === "cat-chocolates",
  },
];

export function giftTypesOf(product: Product): string[] {
  return giftTypeOptions.filter((option) => option.match(product)).map((option) => option.id);
}

const ingredientKeywords = [
  "Pistachio",
  "Walnut",
  "Cashew",
  "Almond",
  "Dates",
  "Chocolate",
  "Semolina",
];

export function ingredientsOf(product: Product): string[] {
  const haystack = [
    ...product.ingredients,
    product.name,
    product.categoryCue,
    product.shortDescription,
  ]
    .join(" ")
    .toLowerCase();
  return ingredientKeywords.filter((keyword) => haystack.includes(keyword.toLowerCase()));
}

/* ---------------------------- Department ------------------------------ */

export function productsOfDepartment(id: DepartmentId): Product[] {
  const department = departments.find((d) => d.id === id);
  if (!department) return [];
  return allProducts.filter((product) => department.categoryIds.includes(product.categoryId));
}

export function categoriesOfDepartment(id: DepartmentId) {
  const department = departments.find((d) => d.id === id);
  if (!department) return [];
  return categoriesAll.filter((category) => department.categoryIds.includes(category.id));
}

/* ------------------------------ Filtering ----------------------------- */

export function priceOf(product: Product) {
  return product.variants[0]?.price.amount ?? 0;
}

export function filterProducts(list: Product[], search: CatalogSearch): Product[] {
  const categoryId = categoriesAll.find((c) => c.slug === search.category)?.id;

  const filtered = list.filter((product) => {
    if (categoryId && product.categoryId !== categoryId) return false;
    if (search.collection && !product.collectionIds.includes(search.collection)) return false;
    if (search.occasion && !product.occasions.includes(search.occasion)) return false;
    if (search.recipient && !recipientsOf(product).includes(search.recipient)) return false;
    if (search.giftType && !giftTypesOf(product).includes(search.giftType)) return false;
    if (search.ingredient && !ingredientsOf(product).includes(search.ingredient)) return false;
    if (search.maxPrice && priceOf(product) > search.maxPrice) return false;
    return true;
  });

  const sorted = [...filtered];
  if (search.sort === "price-asc") sorted.sort((a, b) => priceOf(a) - priceOf(b));
  if (search.sort === "price-desc") sorted.sort((a, b) => priceOf(b) - priceOf(a));
  if (search.sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
  return sorted;
}

/** Only offer a facet value when at least one product in scope carries it. */
export function availableOccasions(list: Product[]): string[] {
  const set = new Set<string>();
  for (const product of list) for (const occasion of product.occasions) set.add(occasion);
  return [...set].sort();
}

export function availableRecipients(list: Product[]) {
  const set = new Set(list.flatMap(recipientsOf));
  return recipientOptions.filter((option) => set.has(option.id));
}

export function availableGiftTypes(list: Product[]) {
  const set = new Set(list.flatMap(giftTypesOf));
  return giftTypeOptions.filter((option) => set.has(option.id));
}

export function availableIngredients(list: Product[]): string[] {
  const set = new Set(list.flatMap(ingredientsOf));
  return ingredientKeywords.filter((keyword) => set.has(keyword));
}

export function priceCeiling(list: Product[]): number {
  const max = list.reduce((acc, product) => Math.max(acc, priceOf(product)), 0);
  return Math.ceil((max || 1000) / 250) * 250;
}

export const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name: A–Z" },
];
