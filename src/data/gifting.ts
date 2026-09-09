import type { GiftBoxFormat, GiftFinish, GiftingOccasion, Money } from "./types";

/** MOCK GIFTING CONTENT — structure is final, values are placeholders. */

const inr = (amount: number): Money => ({ amount, currency: "INR" });

export const occasionGroups = [
  {
    id: "corporate",
    title: "Corporate Gifting",
    intro: "Programmes for clients, teams and partners, repeated with consistent presentation.",
  },
  {
    id: "wedding",
    title: "Wedding Gifting",
    intro: "Trousseau, welcome hampers and guest favours in matched formats.",
  },
  {
    id: "festival",
    title: "Festival Gifting",
    intro: "Diwali, Eid, Holi, Raksha Bandhan, Christmas and Navratri selections.",
  },
  {
    id: "baby-family",
    title: "Baby & Family Celebrations",
    intro: "Baby shower, naming and annaprashan gifting for close circles.",
  },
  {
    id: "personal",
    title: "Personal Occasions",
    intro: "Birthdays, anniversaries, housewarmings and thank-yous.",
  },
  {
    id: "premium",
    title: "Premium Gifting",
    intro: "Milestones, diplomatic gifting and bespoke commissions.",
  },
] as const;

export const giftingOccasions: GiftingOccasion[] = [
  {
    id: "occ-corporate-client",
    slug: "client-gifting",
    group: "corporate",
    title: "Client & partner gifting",
    summary: "Considered boxes that carry a company name without shouting it.",
    examples: ["Crownmate", "Noir Grande", "Grand Gourmet Assortment"],
  },
  {
    id: "occ-corporate-team",
    slug: "employee-gifting",
    group: "corporate",
    title: "Employee & team gifting",
    summary: "Repeatable formats for volume dispatch across offices.",
    examples: ["Craft", "Pure Shine", "Premium Baklava Assortment"],
  },
  {
    id: "occ-wedding-trousseau",
    slug: "wedding-trousseau",
    group: "wedding",
    title: "Trousseau & family gifting",
    summary: "Larger chests for the families at the centre of the day.",
    examples: ["Rosello 25", "Fern 25"],
  },
  {
    id: "occ-wedding-guest",
    slug: "wedding-favours",
    group: "wedding",
    title: "Guest favours",
    summary: "Small matched boxes produced to a single specification.",
    examples: ["Pure Spark", "Craft"],
  },
  {
    id: "occ-festival-diwali",
    slug: "diwali",
    group: "festival",
    title: "Diwali",
    summary: "Sweets, dates and dry fruit in festive presentation.",
    examples: ["Sweet Symphony", "Premium Nut Selection"],
  },
  {
    id: "occ-festival-eid",
    slug: "eid",
    group: "festival",
    title: "Eid",
    summary: "Baklawa, ma'amoul and dates for the table and for giving.",
    examples: ["Premium Baklava Assortment", "Tamaar Khaleeji Dates"],
  },
  {
    id: "occ-festival-other",
    slug: "seasonal-festivals",
    group: "festival",
    title: "Holi, Raksha Bandhan, Christmas & Navratri",
    summary: "Seasonal runs released through the year.",
    examples: ["Festive Hamper", "Chocodates"],
  },
  {
    id: "occ-baby-shower",
    slug: "baby-shower",
    group: "baby-family",
    title: "Baby shower & naming",
    summary: "Soft, shareable selections for close family gatherings.",
    examples: ["Pure Bliss", "Fusion Bites"],
  },
  {
    id: "occ-annaprashan",
    slug: "annaprashan",
    group: "baby-family",
    title: "Annaprashan",
    summary: "Small boxes for the guests who come to mark the day.",
    examples: ["Craft", "Chocodates"],
  },
  {
    id: "occ-birthday",
    slug: "birthdays-anniversaries",
    group: "personal",
    title: "Birthdays & anniversaries",
    summary: "A box that reads as a considered present, not an errand.",
    examples: ["Noir Treat", "Rosello 16"],
  },
  {
    id: "occ-housewarming",
    slug: "housewarming-thank-you",
    group: "personal",
    title: "Housewarming & thank-you",
    summary: "Compact formats that travel well and arrive intact.",
    examples: ["Pure Spark", "Turkish Delight Selection"],
  },
  {
    id: "occ-milestone",
    slug: "milestones",
    group: "premium",
    title: "Milestones & recognition",
    summary: "Larger chests for anniversaries, awards and long-service gifting.",
    examples: ["Rosello 25", "Tote Allure"],
  },
  {
    id: "occ-diplomatic",
    slug: "diplomatic-gifting",
    group: "premium",
    title: "Diplomatic & bespoke",
    summary: "Bespoke commissions discussed case by case with our team.",
    examples: ["Fern 25", "Crownmate"],
  },
];

export const giftBoxFormats: GiftBoxFormat[] = [
  {
    id: "fmt-9",
    name: "Petite Box",
    format: "box",
    capacity: 9,
    basePrice: inr(650),
    description: "Nine compartments — a compact gift or a considered thank-you.",
  },
  {
    id: "fmt-16",
    name: "Signature Box",
    format: "box",
    capacity: 16,
    basePrice: inr(1050),
    description: "Sixteen compartments — the everyday gifting size.",
  },
  {
    id: "fmt-25",
    name: "Grand Chest",
    format: "chest",
    capacity: 25,
    basePrice: inr(1650),
    description: "Twenty-five compartments in a lidded chest.",
  },
  {
    id: "fmt-36",
    name: "Maison Chest",
    format: "chest",
    capacity: 36,
    basePrice: inr(2350),
    description: "Thirty-six compartments for weddings and milestone gifting.",
  },
];

export const ribbonFinishes: GiftFinish[] = [
  { id: "rib-none", label: "No ribbon", surcharge: 0 },
  { id: "rib-sand", label: "Sand silk ribbon", surcharge: 60 },
  { id: "rib-sage", label: "Sage silk ribbon", surcharge: 60 },
  { id: "rib-espresso", label: "Espresso silk ribbon", surcharge: 60 },
  { id: "rib-gold", label: "Antique gold ribbon", surcharge: 90 },
];

export const sealFinishes: GiftFinish[] = [
  { id: "seal-none", label: "No seal", surcharge: 0 },
  { id: "seal-wax-gold", label: "Gold wax seal", surcharge: 80 },
  { id: "seal-wax-espresso", label: "Espresso wax seal", surcharge: 80 },
  { id: "seal-card", label: "Handwritten card", surcharge: 120 },
];

/** Mock per-piece price used only by the /build-a-gift demonstrator. */
export const perPiecePrice = inr(95);

export const GIFT_MESSAGE_MAX = 250;
