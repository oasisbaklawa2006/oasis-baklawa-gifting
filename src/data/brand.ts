/**
 * OASIS BRAND SOURCE OF TRUTH
 *
 * Every fact, logo, photograph, location and contact detail in this file comes
 * from the published Oasis Baklawa website and its media library. Nothing here
 * is invented: if a value is not published, it is simply absent.
 *
 * All remote media is served from the brand's own media host so the original
 * packaging and logo artwork is displayed, never redrawn.
 */

export const MEDIA_HOST = "https://static.wixstatic.com";

/* ----------------------------- Identity ------------------------------ */

export const brand = {
  name: "Oasis Baklawa",
  legalOwner: "TCF Chocolates & Gifts Pvt. Ltd.",
  manufacturingNote: "Manufactured, processed and packed by TCF Chocolates & Gifts Pvt. Ltd.",
  positioning: "Becoming India’s most preferred Arabic sweets brand.",
  vision:
    "To offer the best in quality, with competitive pricing, one-to-one service and express delivery.",
  mission:
    "To maintain our lead in the sweets industry by spreading the taste of baklawa across India, delighting even the most discerning clients with high-quality, innovative products and a memorable taste experience.",
  coreValues: [
    {
      title: "Breakthrough Innovations",
      detail: "An in-house research team develops products exclusive to Oasis.",
    },
    {
      title: "Exceeding Expectations",
      detail: "Quality, packaging and service judged by the most discerning client.",
    },
    {
      title: "Success Through Excellence",
      detail: "Craft first: the range grows only where we can hold the standard.",
    },
    { title: "Trust of Generations", detail: "A family-owned house, built order by order." },
  ],
} as const;

/** The published brand story, in the house voice. */
export const brandStory = [
  {
    title: "A family passion",
    body: "Oasis Baklawa is a family-owned business born from a passion for chocolates, baklava and the art of gifting.",
  },
  {
    title: "From Dubai to India",
    body: "It began by bringing baklava from a well-known Dubai patisserie to the Indian market, presented at exhibitions — starting with just two table setups.",
  },
  {
    title: "Demand became a kitchen",
    body: "Interest grew faster than the imports could satisfy, so production moved to India and an in-house research team began developing products exclusive to Oasis.",
  },
  {
    title: "A wider house",
    body: "The range expanded beyond baklawa into artisanal chocolates, confections and specialty gifting, with the same attention to packaging and presentation.",
  },
  {
    title: "Kirti Nagar today",
    body: "Production is carried out at our own unit in Kirti Nagar, New Delhi, with quality, innovation, packaging, distribution and customer experience under one roof.",
  },
] as const;

/* ------------------------------- Logos -------------------------------- */

export const logos = {
  horizontal: {
    src: `${MEDIA_HOST}/media/9c1729_900c021bbfc540e386ac306752affdf9~mv2.png`,
    alt: "Oasis Baklawa",
  },
  square: {
    src: `${MEDIA_HOST}/media/9c1729_6c4394d7f23a4c7f9d0a14fd48f563da~mv2.jpg`,
    alt: "Oasis Baklawa emblem",
  },
  oval: {
    src: `${MEDIA_HOST}/media/9c1729_0ce59385faef4de488573989b3a8734c~mv2.png`,
    alt: "Oasis Baklawa oval emblem",
  },
  gold: {
    src: `${MEDIA_HOST}/media/9c1729_74900376939a4d698753f2293cd82a11~mv2.png`,
    alt: "Oasis Baklawa gold emblem",
  },
} as const;

/* --------------------------- Brand imagery ---------------------------- */

export type BrandImage = { src: string; alt: string };

export const brandMedia = {
  hero: {
    src: `${MEDIA_HOST}/media/9c1729_0b6300e1a2304991850873385c6e48a8~mv2.jpg`,
    alt: "Oasis Baklawa pastries arranged for presentation",
  },
  craft: {
    src: `${MEDIA_HOST}/media/9c1729_a16fb9358e1f415b9c4cff9018b61f85~mv2.jpg`,
    alt: "Baklawa being prepared by hand at Oasis",
  },
  factory: {
    src: `${MEDIA_HOST}/media/9c1729_5ccba723c5e74f7e999ba7e366ac3c4c~mv2.png`,
    alt: "The Oasis production unit in Kirti Nagar, New Delhi",
  },
  factoryAlt: {
    src: `${MEDIA_HOST}/media/9c1729_bde06404a3ea46a981b909740a273ace~mv2.png`,
    alt: "Inside the Oasis production unit",
  },
  headOffice: {
    src: `${MEDIA_HOST}/media/9c1729_4fd9791ddc9e481297c513eaa1898363~mv2.jpg`,
    alt: "TCF Chocolates & Gifts head office at Kirti Nagar, New Delhi",
  },
  team: {
    src: `${MEDIA_HOST}/media/9c1729_802c5e093b754170a2ac825816d4358a~mv2.png`,
    alt: "The Oasis team at work",
  },
  giftBanner: {
    src: `${MEDIA_HOST}/media/9c1729_4e32d10786734a1d98b2971992fce9be~mv2.jpg`,
    alt: "Oasis gift hampers dressed with ribbon",
  },
  chocolateBanner: {
    src: `${MEDIA_HOST}/media/9c1729_d94e34c3630744a1aace79302fe96891~mv2.jpg`,
    alt: "Oasis artisanal chocolates",
  },
  dates: {
    src: `${MEDIA_HOST}/media/9c1729_584ab9c0312445d282be292a9c7e89fe~mv2.jpg`,
    alt: "Arabic dates from the Oasis range",
  },
  chocolates: {
    src: `${MEDIA_HOST}/media/9c1729_1144624bdb1f4ed69e7b4e08ee4e46ba~mv2.jpg`,
    alt: "A selection of Oasis chocolates",
  },
} as const satisfies Record<string, BrandImage>;

/**
 * Product photography, keyed by product slug. Each image is the photograph
 * attached to that product record — never a category stand-in.
 */
export const productMedia: Record<string, BrandImage> = {
  "rosello-25": {
    src: `${MEDIA_HOST}/media/9c1729_e7c52a5771a34a73ac629ff8afd0568b~mv2.jpg/v1/fit/w_1080,h_1080,q_90/file.jpg`,
    alt: "Rosello 25 presentation chest by Oasis Baklawa",
  },
  "rosello-16": {
    src: `${MEDIA_HOST}/media/9c1729_d8e6dd7870e849e2aec5a292de7da7f4~mv2.jpg/v1/fit/w_1080,h_1080,q_90/file.jpg`,
    alt: "Rosello 16 presentation box by Oasis Baklawa",
  },
  "marine-16": {
    src: `${MEDIA_HOST}/media/9c1729_bb3ef71642924c7ebeed02f45f9f73d6~mv2.jpg/v1/fit/w_1080,h_1080,q_90/file.jpg`,
    alt: "Marine 16 gift box by Oasis Baklawa",
  },
  "pure-spark": {
    src: `${MEDIA_HOST}/media/9c1729_b67b2c6debf346279a4ead03949f6b00~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Pure Spark gift box by Oasis Baklawa",
  },
  "pure-shine": {
    src: `${MEDIA_HOST}/media/9c1729_ccae30f102404ab7b89a25b9e257b9e6~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Pure Shine gift box by Oasis Baklawa",
  },
  "pure-bliss": {
    src: `${MEDIA_HOST}/media/9c1729_64ccb2c6a6ed498ea9f7a6d0fb869587~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Pure Bliss gift box by Oasis Baklawa",
  },
  "fern-25": {
    src: `${MEDIA_HOST}/media/9c1729_0c853958ad484682a88191989777b5fa~mv2.png/v1/fit/w_1500,h_1500,q_90/file.png`,
    alt: "Fern 25 presentation chest by Oasis Baklawa",
  },
  "noir-treat": {
    src: `${MEDIA_HOST}/media/9c1729_394cdd7d36cc47dcbcfa5f31b4dcda33~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Noir Treat gift box by Oasis Baklawa",
  },
  "noir-grande": {
    src: `${MEDIA_HOST}/media/9c1729_9183570abbc146b2ad4062a0637ebb76~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Noir Grande gift chest by Oasis Baklawa",
  },
  "tote-allure": {
    src: `${MEDIA_HOST}/media/9c1729_7b72e0db799f4b159b1a20e077e70468~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Tote Allure gift tote by Oasis Baklawa",
  },
  craft: {
    src: `${MEDIA_HOST}/media/9c1729_14b150f5d03d487f8e27eaec0216788e~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Craft gift box by Oasis Baklawa",
  },
  crownmate: {
    src: `${MEDIA_HOST}/media/9c1729_7e8a266f9cfa4e3e8a58417b5d3a1b5e~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Crownmate gift box by Oasis Baklawa",
  },
  "premium-baklava-assortment": {
    src: `${MEDIA_HOST}/media/9c1729_f0406838d2154b42a8814b4bb7420d37~mv2.jpg/v1/fit/w_2000,h_2000,q_90/file.jpg`,
    alt: "Premium Baklawa pack by Oasis Baklawa",
  },
  "kadayif-baklawa": {
    src: `${MEDIA_HOST}/media/9c1729_ed55452cf62a485c80b1dbec7996af12~mv2.jpg`,
    alt: "Kadayif baklawa by Oasis Baklawa",
  },
  "walnut-kadayif": {
    src: `${MEDIA_HOST}/media/9c1729_060646781dba4be6866946e18091b18b~mv2.jpg`,
    alt: "Walnut kadayif by Oasis Baklawa",
  },
  "kadayif-asabeh": {
    src: `${MEDIA_HOST}/media/9c1729_0bb2645556e64b019f278eb049a600e0~mv2.jpg`,
    alt: "Kadayif asabeh by Oasis Baklawa",
  },
  "choco-cashew-kadayif": {
    src: `${MEDIA_HOST}/media/9c1729_68bda2e052c7409abffc14dae9e8c7c4~mv2.jpg`,
    alt: "Choco cashew kadayif by Oasis Baklawa",
  },
  "chocolate-nutella-baklava": {
    src: `${MEDIA_HOST}/media/9c1729_d9938042617b478d8c25bbadc018cba8~mv2.jpg`,
    alt: "Chocolate Nutella baklava by Oasis Baklawa",
  },
  "gift-hamper": {
    src: `${MEDIA_HOST}/media/9c1729_de57912d1f82426e800e536249129868~mv2.jpg`,
    alt: "Oasis Baklawa gift hamper",
  },
};

/** Named product images for merchandising rows that reference a family. */
export const familyMedia = {
  baklawa: productMedia["premium-baklava-assortment"]!,
  dates: brandMedia.dates,
  chocolates: brandMedia.chocolates,
  gifting: brandMedia.giftBanner,
  kadayif: productMedia["kadayif-baklawa"]!,
} as const;

/** Product slugs presented as top sellers on the published site. */
export const topSellerSlugs = [
  "rosello-25",
  "rosello-16",
  "marine-16",
  "pure-spark",
  "pure-shine",
  "pure-bliss",
] as const;

/** Gifting shortlist presented for quick shopping on the published site. */
export const quickShopSlugs = [
  "fern-25",
  "noir-treat",
  "noir-grande",
  "tote-allure",
  "craft",
  "crownmate",
] as const;

/* ------------------------------ Contact ------------------------------- */

export const contact = {
  phone: "+91 72919 94141",
  phoneHref: "tel:+917291994141",
  email: "info@oasisbaklawa.com",
  emailHref: "mailto:info@oasisbaklawa.com",
  headOffice: {
    lines: ["10/62 Kirti Nagar Industrial Area", "New Delhi 110015", "India"],
  },
} as const;

/* ----------------------------- Locations ------------------------------ */

export type Location = {
  id: string;
  name: string;
  kind: "production" | "store";
  addressLines: string[];
  city: string;
  state: string;
  postalCode: string;
};

/** Published Oasis locations. Opening hours are not published, so none are shown. */
export const locations: Location[] = [
  {
    id: "loc-kirti-nagar",
    name: "Head Office & Production — Kirti Nagar",
    kind: "production",
    addressLines: ["10/62 Kirti Nagar Industrial Area"],
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110015",
  },
  {
    id: "loc-east-patel-nagar",
    name: "East Patel Nagar",
    kind: "store",
    addressLines: ["23/5-B East Patel Nagar", "Main Market"],
    city: "New Delhi",
    state: "Delhi",
    postalCode: "110008",
  },
  {
    id: "loc-paschim-vihar",
    name: "Paschim Vihar",
    kind: "store",
    addressLines: ["B-17, Shubham Enclave", "Paschim Vihar"],
    city: "Delhi",
    state: "Delhi",
    postalCode: "110063",
  },
  {
    id: "loc-kamla-nagar",
    name: "Kamla Nagar",
    kind: "store",
    addressLines: ["3-D Kamla Nagar"],
    city: "Delhi",
    state: "Delhi",
    postalCode: "110007",
  },
  {
    id: "loc-ashok-vihar",
    name: "Ashok Vihar",
    kind: "store",
    addressLines: ["117A Ground, Pocket D", "Ashok Vihar Phase-3"],
    city: "Delhi",
    state: "Delhi",
    postalCode: "110053",
  },
  {
    id: "loc-saket",
    name: "Select Citywalk, Saket",
    kind: "store",
    addressLines: ["G 63 A, Ground Floor", "Select Citywalk Mall, Saket"],
    city: "Delhi",
    state: "Delhi",
    postalCode: "110017",
  },
  {
    id: "loc-nsp",
    name: "Pacific Mall, Netaji Subhash Place",
    kind: "store",
    addressLines: ["SH 22, Level 1", "Pacific Mall, Netaji Subhash Place"],
    city: "Delhi",
    state: "Delhi",
    postalCode: "110034",
  },
  {
    id: "loc-noida",
    name: "DLF Mall of India, Noida",
    kind: "store",
    addressLines: ["2K-12, International Boulevard", "Mall of India, Sector 18"],
    city: "Noida",
    state: "Uttar Pradesh",
    postalCode: "201304",
  },
  {
    id: "loc-amritsar-nexus",
    name: "Nexus Mall of Amritsar",
    kind: "store",
    addressLines: ["Level 3, Hamley’s", "Nexus, Mall of Amritsar"],
    city: "Amritsar",
    state: "Punjab",
    postalCode: "143001",
  },
  {
    id: "loc-amritsar-mall-road",
    name: "Mall Road, Amritsar",
    kind: "store",
    addressLines: ["69, Joshi Colony"],
    city: "Amritsar",
    state: "Punjab",
    postalCode: "143001",
  },
  {
    id: "loc-srinagar",
    name: "Residency Road, Srinagar",
    kind: "store",
    addressLines: ["Central Market, Abi Guzer", "Residency Road"],
    city: "Srinagar",
    state: "Jammu & Kashmir",
    postalCode: "190001",
  },
];

export const storeLocations = locations.filter((location) => location.kind === "store");

/** Restrained branded stand-in for records with no published photograph. */
export const noImage = logos.oval;
