import { images } from "./catalog";

/**
 * EDITORIAL JOURNAL — mock content for UI work.
 * Copy is written to be replaceable: swap this module for a CMS collection
 * without touching the routes. No claims, statistics or credentials are made.
 */

export type ArticleCategory = "Gift guides" | "Ingredient spotlights" | "Stories";

export type ArticleSection = {
  heading: string;
  paragraphs: string[];
  /** Optional in-body links back into the catalogue. */
  productSlugs?: string[];
};

export type Article = {
  slug: string;
  title: string;
  kicker: string;
  category: ArticleCategory;
  excerpt: string;
  /** ISO date — placeholder editorial dates for ordering only. */
  published: string;
  readingMinutes: number;
  image: { src: string; alt: string };
  intro: string;
  sections: ArticleSection[];
  /** Internal linking targets. */
  relatedProductSlugs: string[];
  relatedCollectionSlugs: string[];
  relatedArticleSlugs: string[];
};

export const articles: Article[] = [
  {
    slug: "gift-guide-festive-boxes",
    title: "A gift guide for festive tables",
    kicker: "What to send when the house is full",
    category: "Gift guides",
    excerpt:
      "Choosing between a tray, a boxed assortment and a hamper — a practical guide to festive gifting formats and the quantities that suit them.",
    published: "2026-01-12",
    readingMinutes: 5,
    image: {
      src: images.giftBox,
      alt: "A rigid gift box of baklawa with an inner tray, closed with a ribbon",
    },
    intro:
      "Festive gifting is mostly a question of format. The sweets do the work; the box decides whether the gift reads as a gesture or an afterthought. Here is how we think about it.",
    sections: [
      {
        heading: "Start with how it will be opened",
        paragraphs: [
          "A box opened at a table full of people needs pieces that are easy to lift and share. A box handed over at a doorway is better as a sealed, gift-ready format that travels well and keeps its presentation.",
          "If you are unsure, the assortment formats are the safer choice — they cover more preferences in one box without needing to know anyone's favourite.",
        ],
        productSlugs: ["baklawa-gift-box", "premium-arabic-sweets-assortment"],
      },
      {
        heading: "Quantities that actually get eaten",
        paragraphs: [
          "For a household of four to six, a mid-size box is usually enough alongside everything else on the table. For a larger gathering, a hamper works better than two small boxes because it arrives as one object.",
        ],
        productSlugs: ["festive-hamper", "assorted-baklawa"],
      },
      {
        heading: "When the recipient is a household you don't know well",
        paragraphs: [
          "Pick the signature pistachio: it is the most recognisable of the range and rarely divides a room. Add a card insert if the gift is going out on your behalf.",
        ],
        productSlugs: ["signature-pistachio-baklawa"],
      },
    ],
    relatedProductSlugs: ["baklawa-gift-box", "festive-hamper", "signature-pistachio-baklawa"],
    relatedCollectionSlugs: ["gifting", "seasonal"],
    relatedArticleSlugs: ["gift-guide-corporate-gifting", "ingredient-pistachio"],
  },
  {
    slug: "gift-guide-corporate-gifting",
    title: "Corporate gifting without the guesswork",
    kicker: "Repeatable presentation at volume",
    category: "Gift guides",
    excerpt:
      "How to plan a client or team gifting run: choosing one format, keeping presentation consistent, and giving yourself enough lead time.",
    published: "2026-02-04",
    readingMinutes: 4,
    image: {
      src: images.assorted,
      alt: "An assortment of Arabic sweets arranged in neat rows in a presentation tray",
    },
    intro:
      "Volume gifting rewards restraint. One format, one presentation, repeated cleanly, reads better than a mixed selection assembled at the last minute.",
    sections: [
      {
        heading: "Choose one format and stay with it",
        paragraphs: [
          "Consistency is what makes a gifting run look considered. Select a single box format for the whole list, then vary only the card insert where the message needs to change.",
        ],
        productSlugs: ["corporate-gift-box"],
      },
      {
        heading: "Give the kitchen lead time",
        paragraphs: [
          "Everything is made in small batches, so larger runs are scheduled rather than pulled from stock. Share your quantity and delivery window early and the rest becomes straightforward.",
        ],
      },
      {
        heading: "Decide who is handing it over",
        paragraphs: [
          "Gifts delivered by hand can be simpler in presentation. Gifts shipped to many addresses need packaging that protects the tray and still looks intact on arrival.",
        ],
        productSlugs: ["baklawa-gift-box"],
      },
    ],
    relatedProductSlugs: ["corporate-gift-box", "baklawa-gift-box", "premium-arabic-sweets-assortment"],
    relatedCollectionSlugs: ["corporate", "gifting"],
    relatedArticleSlugs: ["gift-guide-festive-boxes", "story-dubai-souk"],
  },
  {
    slug: "ingredient-pistachio",
    title: "Pistachio, and why we use so much of it",
    kicker: "Ingredient spotlight",
    category: "Ingredient spotlights",
    excerpt:
      "The nut that defines the range: how grind, colour and quantity change the character of a piece of baklawa.",
    published: "2026-02-20",
    readingMinutes: 6,
    image: {
      src: images.heroBaklawa,
      alt: "Close view of pistachio baklawa showing the green nut filling between filo layers",
    },
    intro:
      "Pistachio is the loudest ingredient in the range and the least forgiving. Too fine and it turns to paste; too coarse and it falls out of the pastry.",
    sections: [
      {
        heading: "Grind changes everything",
        paragraphs: [
          "A medium grind keeps texture in the bite while still binding under syrup. It is the difference between tasting the nut and simply tasting sweetness.",
        ],
        productSlugs: ["signature-pistachio-baklawa", "midya-pistachio"],
      },
      {
        heading: "Where the colour comes from",
        paragraphs: [
          "The green is the nut, not a dye. It shifts a little between batches, which is expected in something made in small quantities rather than in a single continuous run.",
        ],
        productSlugs: ["bulbul-pistachio", "kataifi-pistachio"],
      },
      {
        heading: "Allergen note",
        paragraphs: [
          "Every pistachio product contains tree nuts, and the kitchen handles several nut varieties. Full ingredient and allergen information is listed on each product page.",
        ],
      },
    ],
    relatedProductSlugs: ["signature-pistachio-baklawa", "midya-pistachio", "bulbul-pistachio"],
    relatedCollectionSlugs: ["signature"],
    relatedArticleSlugs: ["ingredient-filo-and-butter", "gift-guide-festive-boxes"],
  },
  {
    slug: "ingredient-filo-and-butter",
    title: "Filo, butter and the patience in between",
    kicker: "Ingredient spotlight",
    category: "Ingredient spotlights",
    excerpt:
      "Layer count, clarified butter and oven temperature — the three variables that decide whether baklawa shatters or sags.",
    published: "2026-03-08",
    readingMinutes: 5,
    image: {
      src: images.craftFilo,
      alt: "Hands brushing clarified butter across a sheet of filo pastry on a work surface",
    },
    intro:
      "Baklawa is a pastry problem before it is a sweet one. Everything memorable about the bite happens in the layers.",
    sections: [
      {
        heading: "Layers are structure, not decoration",
        paragraphs: [
          "Each sheet is brushed rather than soaked. Enough butter to crisp, not so much that the stack collapses under syrup.",
        ],
        productSlugs: ["assorted-baklawa", "walnut-baklawa"],
      },
      {
        heading: "Syrup goes on at the right temperature",
        paragraphs: [
          "The relationship between hot pastry and cooler syrup is what keeps the top layers crisp. Get it wrong and the whole tray turns soft within the hour.",
        ],
      },
      {
        heading: "Why shapes differ",
        paragraphs: [
          "Kataifi, midya and bulbul are not just presentation choices — the shape changes the ratio of pastry to filling, and with it the way each piece eats.",
        ],
        productSlugs: ["kataifi-pistachio", "cashew-fingers"],
      },
    ],
    relatedProductSlugs: ["assorted-baklawa", "kataifi-pistachio", "walnut-baklawa"],
    relatedCollectionSlugs: ["signature"],
    relatedArticleSlugs: ["ingredient-pistachio", "story-dubai-souk"],
  },
  {
    slug: "story-dubai-souk",
    title: "From the souk to the counter",
    kicker: "The Dubai Souk story",
    category: "Stories",
    excerpt:
      "Sweet trays in a Dubai souk are arranged with an eye for order and abundance at once. That tension shaped how we present the range.",
    published: "2026-03-24",
    readingMinutes: 7,
    image: {
      src: images.assorted,
      alt: "Trays of Arabic sweets arranged in tight rows, as displayed in a souk sweet shop",
    },
    intro:
      "Walk through a sweet souk and the display does the selling. Trays sit edge to edge, pieces cut to the same size, colour repeating down the counter. Nothing is styled, and yet everything is composed.",
    sections: [
      {
        heading: "Order as abundance",
        paragraphs: [
          "The appeal is not variety for its own sake — it is repetition. A hundred identical pieces read as generosity in a way a scattered selection never does.",
          "That idea sits behind how the boxes are packed: even rows, consistent cuts, no filler.",
        ],
        productSlugs: ["assorted-baklawa", "premium-arabic-sweets-assortment"],
      },
      {
        heading: "Buying by weight, not by piece",
        paragraphs: [
          "Souk counters sell by weight, and customers mix as they go. The assortment formats keep that habit intact for anyone ordering at a distance.",
        ],
        productSlugs: ["premium-arabic-sweets-assortment"],
      },
      {
        heading: "What we deliberately left behind",
        paragraphs: [
          "Not everything translates. Heavy ornament, gold trim and crowded signage belong to the counter, not to a box that will sit on someone's table. The restraint is the modern part.",
        ],
      },
    ],
    relatedProductSlugs: ["premium-arabic-sweets-assortment", "assorted-baklawa", "stuffed-date-selection"],
    relatedCollectionSlugs: ["signature", "gifting"],
    relatedArticleSlugs: ["ingredient-filo-and-butter", "gift-guide-corporate-gifting"],
  },
  {
    slug: "story-serving-and-storing",
    title: "Serving, storing and making a tray last",
    kicker: "Notes from the counter",
    category: "Stories",
    excerpt:
      "Simple handling notes: how to keep pastry crisp, what to serve alongside, and how to present a box you did not make yourself.",
    published: "2026-04-06",
    readingMinutes: 4,
    image: {
      src: images.heroBaklawa,
      alt: "Baklawa pieces arranged on a serving plate beside small cups of coffee",
    },
    intro:
      "Most of what goes wrong with baklawa at home happens after it arrives. A few small habits keep a tray in good condition.",
    sections: [
      {
        heading: "Keep it sealed and cool",
        paragraphs: [
          "Cool and dry, in the box it came in. Refrigeration is rarely a help — it firms the syrup and dulls the pastry. Product-specific storage guidance is listed on each product page.",
        ],
        productSlugs: ["signature-pistachio-baklawa"],
      },
      {
        heading: "Serve smaller than you think",
        paragraphs: [
          "Two or three pieces per person is generous. Strong coffee or unsweetened tea alongside keeps the sweetness in balance.",
        ],
      },
      {
        heading: "Presenting a box you are passing on",
        paragraphs: [
          "Leave the inner tray in place, remove the outer sleeve only at the table, and let the arrangement do the rest.",
        ],
        productSlugs: ["baklawa-gift-box"],
      },
    ],
    relatedProductSlugs: ["signature-pistachio-baklawa", "baklawa-gift-box", "assorted-baklawa"],
    relatedCollectionSlugs: ["signature", "gifting"],
    relatedArticleSlugs: ["ingredient-filo-and-butter", "gift-guide-festive-boxes"],
  },
];

export const articleCategories: ArticleCategory[] = [
  "Gift guides",
  "Ingredient spotlights",
  "Stories",
];

export const getArticleBySlug = (slug: string) => articles.find((a) => a.slug === slug);

export const getArticlesByCategory = (category: ArticleCategory) =>
  articles.filter((a) => a.category === category);

/** Newest first, by placeholder publish date. */
export const articlesByDate = [...articles].sort((a, b) => b.published.localeCompare(a.published));
