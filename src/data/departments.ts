import { brandMedia, familyMedia, productMedia } from "./brand";
import type { BrandImage } from "./brand";

/**
 * Top-level departments. A department is a curated entrance into the Oasis
 * range — never a dump of the whole catalogue. Category ids map to the real
 * Oasis taxonomy in `./catalog` and `./catalog-extra`.
 */

export type DepartmentId = "luxury-gifts" | "baklawa" | "gourmet-food";

export type Department = {
  id: DepartmentId;
  /** Canonical route for the department landing page. */
  to: "/luxury-gifts" | "/baklawa" | "/gourmet-food";
  label: string;
  eyebrow: string;
  title: string;
  intro: string;
  hero: BrandImage;
  categoryIds: string[];
};

export const departments: Department[] = [
  {
    id: "luxury-gifts",
    to: "/luxury-gifts",
    label: "Luxury Gifts",
    eyebrow: "Luxury gifts",
    title: "Gifting, arranged with restraint",
    intro:
      "Presentation chests, boxed assortments and hampers from the Oasis gifting range — chosen by occasion, by gift type or by who the gift is for.",
    hero: brandMedia.giftBanner,
    categoryIds: ["cat-luxury-gifting", "cat-gifting", "cat-assortments"],
  },
  {
    id: "baklawa",
    to: "/baklawa",
    label: "Baklawa",
    eyebrow: "The house signature",
    title: "Baklawa, layered by hand",
    intro:
      "Fine filo, clarified butter and generous nuts. The premium trays, the kadayif shapes and the boxed baklawa selections, all made at our own unit in Kirti Nagar.",
    hero: familyMedia.baklawa,
    categoryIds: ["cat-baklawa", "cat-pistachio"],
  },
  {
    id: "gourmet-food",
    to: "/gourmet-food",
    label: "Gourmet Food",
    eyebrow: "Gourmet food",
    title: "Dates, chocolates and the wider table",
    intro:
      "Arabic dates and chocodates, house chocolates, fusion sweets, Turkish delight and nut selections — the everyday side of the Oasis kitchen.",
    hero: brandMedia.chocolateBanner,
    categoryIds: ["cat-dates", "cat-chocolates", "cat-fusion", "cat-turkish", "cat-nuts"],
  },
];

export const departmentById = (id: DepartmentId) =>
  departments.find((department) => department.id === id)!;

/** Visual entrances used on the homepage — deliberately few. */
export const homeEntrances: { label: string; image: BrandImage; to: string; note: string }[] = [
  {
    label: "Luxury Gifts",
    image: brandMedia.giftBanner,
    to: "/luxury-gifts",
    note: "Chests, boxes and hampers",
  },
  { label: "Baklawa", image: familyMedia.baklawa, to: "/baklawa", note: "The house signature" },
  {
    label: "Arabic Dates",
    image: familyMedia.dates,
    to: "/gourmet-food?category=arabic-dates",
    note: "Dates and chocodates",
  },
  {
    label: "Chocolates",
    image: familyMedia.chocolates,
    to: "/gourmet-food?category=chocolates",
    note: "Ganache, praline, dragées",
  },
  {
    label: "Build Your Own Box",
    image: productMedia["fern-25"]!,
    to: "/build-your-box",
    note: "Composed piece by piece",
  },
  {
    label: "Corporate Gifting",
    image: productMedia["crownmate"]!,
    to: "/corporate",
    note: "Programmes at volume",
  },
];
