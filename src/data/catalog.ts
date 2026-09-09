import heroBaklawa from "@/assets/hero-baklawa.jpg";
import assorted from "@/assets/product-assorted.jpg";
import giftBox from "@/assets/product-giftbox.jpg";
import craftFilo from "@/assets/craft-filo.jpg";

import { extraCategories, extraSeeds, type ProductSeed } from "./catalog-extra";
import { brandMedia, familyMedia, productMedia, topSellerSlugs } from "./brand";
import type { Category, Collection, Money, Product } from "./types";

/**
 * Oasis catalogue. Product names, families and photography follow the published
 * Oasis range; records still awaiting governed data carry `isMock`.
 */

export const images = { heroBaklawa, assorted, giftBox, craftFilo };

const inr = (amount: number): Money => ({ amount, currency: "INR" });

export const categories: Category[] = [
  {
    id: "cat-baklawa",
    slug: "premium-baklawa",
    name: "Premium Baklawa",
    description: "Layered filo, clarified butter and nuts — the house signature.",
    image: familyMedia.baklawa,
  },
  {
    id: "cat-pistachio",
    slug: "kadayif-baklawa",
    name: "Kadayif Baklawa",
    description: "Fine shredded pastry, rolled and baked around nuts.",
    image: familyMedia.kadayif,
  },
  {
    id: "cat-assortments",
    slug: "assortment-gifts",
    name: "Assortment Gifts",
    description: "Curated selections for sharing, hosting and gifting.",
    image: brandMedia.giftBanner,
  },
  {
    id: "cat-gifting",
    slug: "gift-hampers",
    name: "Gift Hampers",
    description: "Considered packaging for occasions and corporate gifting.",
    image: productMedia["gift-hamper"]!,
  },
];

export const collections: Collection[] = [
  {
    id: "col-signature",
    slug: "signature",
    name: "The Signature Collection",
    kicker: "House classics",
    description: "The pieces the kitchen is known for, made to a fixed recipe every day.",
    image: { src: heroBaklawa, alt: "Baklawa tray photographed on ivory linen" },
  },
  {
    id: "col-gifting",
    slug: "gifting",
    name: "Gifting",
    kicker: "Occasion-led",
    description: "Boxed selections sized for festivals, hosting and thank-yous.",
    image: { src: giftBox, alt: "Gift box with ribbon on a warm ivory surface" },
  },
  {
    id: "col-seasonal",
    slug: "seasonal",
    name: "New & Noteworthy",
    kicker: "Seasonal",
    description: "Limited runs and recent additions from the kitchen.",
    image: { src: assorted, alt: "Selection of seasonal Arabic sweets" },
  },
  {
    id: "col-corporate",
    slug: "corporate",
    name: "Corporate Selection",
    kicker: "For business",
    description: "Volume-friendly formats with consistent presentation.",
    image: { src: giftBox, alt: "Stacked corporate gift boxes" },
  },
];

const seeds: ProductSeed[] = [
  {
    id: "p-signature-pistachio",
    slug: "signature-pistachio-baklawa",
    name: "Signature Pistachio Baklawa",
    categoryCue: "Baklawa",
    categoryId: "cat-baklawa",
    collectionIds: ["col-signature", "col-gifting"],
    shortDescription: "Fine filo layers, clarified butter and generous pistachio.",
    description:
      "Our house baklawa: many thin sheets of filo brushed with clarified butter, filled with pistachio and finished with a light sugar syrup. Cut into even pieces and packed the day it is made.",
    story:
      "The recipe is kept deliberately simple — pastry, butter, nuts, syrup — so the quality of each ingredient is visible in the finished piece.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Pistachio", "Sugar", "Water", "Lemon"],
    allergens: ["Wheat (gluten)", "Milk", "Pistachio (tree nuts)"],
    storage: "Store in a cool, dry place away from direct sunlight. Keep the box closed.",
    shelfLife: "Best enjoyed within the period printed on the pack.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Festive", "Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["signature", "bestseller"],
    details: [
      { label: "Style", value: "Classic layered baklawa" },
      { label: "Primary nut", value: "Pistachio" },
      { label: "Packing", value: "Rigid box with inner tray" },
    ],
    variants: [
      { id: "v-250", label: "250 g", price: inr(650), availability: "in-stock" },
      {
        id: "v-500",
        label: "500 g",
        price: inr(1200),
        compareAtPrice: inr(1300),
        availability: "in-stock",
      },
      { id: "v-1000", label: "1 kg", price: inr(2300), availability: "made-to-order" },
    ],
    image: { src: heroBaklawa, alt: "Signature pistachio baklawa arranged on a wooden tray" },
  },
  {
    id: "p-assorted-baklawa",
    slug: "assorted-baklawa",
    name: "Assorted Baklawa",
    categoryCue: "Baklawa",
    categoryId: "cat-baklawa",
    collectionIds: ["col-signature"],
    shortDescription: "A mixed tray across the house baklawa shapes.",
    description:
      "A selection across our baklawa shapes and nut fillings, cut to a consistent size for sharing.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Mixed nuts", "Sugar", "Water"],
    allergens: ["Wheat (gluten)", "Milk", "Tree nuts"],
    storage: "Cool, dry place. Reseal after opening.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["bestseller"],
    details: [{ label: "Assortment", value: "Mixed shapes" }],
    variants: [
      { id: "v-500", label: "500 g", price: inr(1100), availability: "in-stock" },
      { id: "v-1000", label: "1 kg", price: inr(2100), availability: "in-stock" },
    ],
    image: { src: assorted, alt: "Assorted baklawa pieces in a ceramic dish" },
  },
  {
    id: "p-midya",
    slug: "midya-pistachio",
    name: "Midya Pistachio",
    categoryCue: "Kadayif Baklawa",
    categoryId: "cat-pistachio",
    collectionIds: ["col-signature"],
    shortDescription: "Boat-shaped pastry packed with pistachio.",
    description: "A shell of crisp filo shaped by hand and filled generously with pistachio.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Pistachio", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Pistachio (tree nuts)"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["signature"],
    details: [{ label: "Shape", value: "Midya (boat)" }],
    variants: [
      { id: "v-250", label: "250 g", price: inr(690), availability: "in-stock" },
      { id: "v-500", label: "500 g", price: inr(1290), availability: "in-stock" },
    ],
    image: { src: heroBaklawa, alt: "Midya pistachio pastries on a tray" },
  },
  {
    id: "p-bulbul",
    slug: "bulbul-pistachio",
    name: "Bulbul Pistachio",
    categoryCue: "Kadayif Baklawa",
    categoryId: "cat-pistachio",
    collectionIds: ["col-signature"],
    shortDescription: "Rolled filo nests with a pistachio centre.",
    description:
      "Thin filo rolled into a nest, baked to a crisp and finished with chopped pistachio.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Pistachio", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Pistachio (tree nuts)"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual", "Festive"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: [],
    details: [{ label: "Shape", value: "Rolled nest" }],
    variants: [
      { id: "v-250", label: "250 g", price: inr(670), availability: "in-stock" },
      { id: "v-500", label: "500 g", price: inr(1250), availability: "low-stock" },
    ],
    image: { src: heroBaklawa, alt: "Bulbul pistachio nests" },
  },
  {
    id: "p-kataifi",
    slug: "kataifi-pistachio",
    name: "Kataifi Pistachio",
    categoryCue: "Kadayif Baklawa",
    categoryId: "cat-pistachio",
    collectionIds: ["col-seasonal"],
    shortDescription: "Shredded pastry, pistachio, light syrup.",
    description: "Fine shredded pastry wrapped around pistachio and baked until golden.",
    ingredients: ["Kataifi pastry", "Clarified butter", "Pistachio", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Pistachio (tree nuts)"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["new"],
    details: [{ label: "Pastry", value: "Kataifi" }],
    variants: [{ id: "v-400", label: "400 g", price: inr(1050), availability: "in-stock" }],
    image: { src: assorted, alt: "Kataifi pistachio pieces" },
  },
  {
    id: "p-gift-box",
    slug: "baklawa-gift-box",
    name: "Baklawa Gift Box",
    categoryCue: "Gift Hampers",
    categoryId: "cat-gifting",
    collectionIds: ["col-gifting"],
    shortDescription: "A boxed baklawa selection with a ribbon finish.",
    description: "A rigid box holding a mixed baklawa selection, with an inner tray and ribbon.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Mixed nuts", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Tree nuts"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Festive", "Casual", "Corporate"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["gifting"],
    details: [{ label: "Presentation", value: "Rigid box, ribbon" }],
    variants: [
      { id: "v-small", label: "Box of 12", price: inr(950), availability: "in-stock" },
      {
        id: "v-large",
        label: "Box of 24",
        price: inr(1750),
        compareAtPrice: inr(1900),
        availability: "in-stock",
      },
    ],
    image: { src: giftBox, alt: "Baklawa gift box tied with a ribbon" },
  },
  {
    id: "p-premium-assortment",
    slug: "premium-arabic-sweets-assortment",
    name: "Premium Arabic Sweets Assortment",
    categoryCue: "Assortment Gifts",
    categoryId: "cat-assortments",
    collectionIds: ["col-signature", "col-gifting"],
    shortDescription: "A wide selection across the sweets counter.",
    description:
      "A broad assortment across baklawa and other Arabic sweets, arranged for presentation.",
    ingredients: ["Wheat pastry", "Clarified butter", "Mixed nuts", "Sugar", "Semolina"],
    allergens: ["Wheat (gluten)", "Milk", "Tree nuts"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Festive", "Casual", "Corporate"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["bestseller"],
    details: [{ label: "Assortment", value: "Wide selection" }],
    variants: [
      { id: "v-750", label: "750 g", price: inr(1650), availability: "in-stock" },
      { id: "v-1500", label: "1.5 kg", price: inr(3100), availability: "made-to-order" },
    ],
    image: { src: assorted, alt: "Premium Arabic sweets assortment in a dish" },
  },
  {
    id: "p-corporate-box",
    slug: "corporate-gift-box",
    name: "Corporate Gift Box",
    categoryCue: "Corporate gifting",
    categoryId: "cat-gifting",
    collectionIds: ["col-corporate", "col-gifting"],
    shortDescription: "A consistent format for business gifting programmes.",
    description:
      "A repeatable gift format designed for volume orders, with room for a printed card. Customisation is discussed case by case.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Mixed nuts", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Tree nuts"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Volume lead time confirmed on enquiry.",
    occasions: ["Corporate", "Festive"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["gifting"],
    details: [{ label: "Programme", value: "Volume orders on enquiry" }],
    variants: [
      { id: "v-std", label: "Standard box", price: inr(1400), availability: "made-to-order" },
    ],
    image: { src: giftBox, alt: "Corporate gift box in sand-coloured board" },
  },
  {
    id: "p-walnut-baklawa",
    slug: "walnut-baklawa",
    name: "Walnut Baklawa",
    categoryCue: "Baklawa",
    categoryId: "cat-baklawa",
    collectionIds: ["col-signature"],
    shortDescription: "The classic recipe made with walnut.",
    description: "Filo and clarified butter layered with walnut, cut square and lightly syruped.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Walnut", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Walnut (tree nuts)"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: [],
    details: [{ label: "Primary nut", value: "Walnut" }],
    variants: [{ id: "v-500", label: "500 g", price: inr(980), availability: "in-stock" }],
    image: { src: heroBaklawa, alt: "Walnut baklawa squares" },
  },
  {
    id: "p-cashew-fingers",
    slug: "cashew-fingers",
    name: "Cashew Fingers",
    categoryCue: "Baklawa",
    categoryId: "cat-baklawa",
    collectionIds: ["col-seasonal"],
    shortDescription: "Slim rolled pastry with cashew.",
    description: "A slim, rolled format with cashew — lighter than the classic squares.",
    ingredients: ["Wheat filo pastry", "Clarified butter", "Cashew", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Cashew (tree nuts)"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Casual"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["new"],
    details: [{ label: "Shape", value: "Finger roll" }],
    variants: [{ id: "v-400", label: "400 g", price: inr(890), availability: "in-stock" }],
    image: { src: assorted, alt: "Cashew finger pastries" },
  },
  {
    id: "p-festive-hamper",
    slug: "festive-hamper",
    name: "Festive Hamper",
    categoryCue: "Gift Hampers",
    categoryId: "cat-gifting",
    collectionIds: ["col-seasonal", "col-gifting"],
    shortDescription: "A seasonal hamper built around the house selection.",
    description:
      "A seasonal hamper combining baklawa with an assortment, presented in a lidded box.",
    ingredients: ["Wheat pastry", "Clarified butter", "Mixed nuts", "Sugar"],
    allergens: ["Wheat (gluten)", "Milk", "Tree nuts"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Seasonal availability.",
    occasions: ["Festive", "Corporate"],
    dietary: ["Vegetarian", "Contains nuts"],
    badges: ["seasonal"],
    details: [{ label: "Availability", value: "Seasonal" }],
    variants: [{ id: "v-std", label: "Hamper", price: inr(2650), availability: "low-stock" }],
    image: { src: giftBox, alt: "Festive hamper box with ribbon" },
  },
  {
    id: "p-date-selection",
    slug: "stuffed-date-selection",
    name: "Stuffed Date Selection",
    categoryCue: "Assortment Gifts",
    categoryId: "cat-assortments",
    collectionIds: ["col-gifting"],
    shortDescription: "Dates filled with nuts, boxed for gifting.",
    description: "Soft dates filled with nuts and arranged in a shallow presentation tray.",
    ingredients: ["Dates", "Pistachio", "Almond", "Walnut"],
    allergens: ["Tree nuts"],
    storage: "Cool, dry place.",
    shelfLife: "See pack for date.",
    leadTime: "Dispatch timeline shown at checkout.",
    occasions: ["Festive", "Casual"],
    dietary: ["Vegetarian", "Contains nuts", "No added gluten ingredients"],
    badges: [],
    details: [{ label: "Format", value: "Presentation tray" }],
    variants: [{ id: "v-std", label: "Box of 16", price: inr(1150), availability: "in-stock" }],
    image: { src: assorted, alt: "Stuffed dates arranged in a tray" },
  },
];

export const categoriesAll: Category[] = [...categories, ...extraCategories];

/**
 * Family photography used when a product record has no photograph of its own.
 * Only genuine Oasis imagery of that family is used; families without one show
 * a restrained branded card instead of a stand-in photo.
 */
const familyFallback: Record<string, { src: string; alt: string }> = {
  "cat-baklawa": familyMedia.baklawa,
  "cat-pistachio": familyMedia.kadayif,
  "cat-assortments": brandMedia.giftBanner,
  "cat-gifting": productMedia["gift-hamper"]!,
  "cat-dates": familyMedia.dates,
  "cat-chocolates": familyMedia.chocolates,
  "cat-luxury-gifting": brandMedia.giftBanner,
};

export const products: Product[] = [...seeds, ...extraSeeds].map(({ image: _image, ...rest }) => {
  const primary = productMedia[rest.slug] ?? familyFallback[rest.categoryId];
  return {
    ...rest,
    images: primary ? [primary, brandMedia.craft] : [],
  };
});

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);

export const getProductsByCollection = (collectionId: string) =>
  products.filter((p) => p.collectionIds.includes(collectionId));

/** Top sellers as published by Oasis, in the published order. */
export const bestSellers = topSellerSlugs
  .map((slug) => products.find((p) => p.slug === slug))
  .filter((p): p is Product => Boolean(p));

export const occasions = [
  "Festive",
  "Wedding",
  "Mehendi",
  "Baby Shower",
  "Corporate",
  "Casual",
  "Premium",
];
export const dietaryOptions = ["Vegetarian", "Contains nuts", "No added gluten ingredients"];
