import type { CorporateCapability, NavigationItem, Store, Testimonial } from "./types";
import { contact, storeLocations } from "./brand";

/** Site content. Brand facts, locations and contact details come from ./brand. */

export const announcements = [
  "Freshly made in small batches",
  "Gift boxing available on every order",
  "Corporate & wholesale enquiries welcome",
];

export const primaryNav: NavigationItem[] = [
  {
    label: "Shop",
    to: "/shop",
    columns: [
      {
        title: "Baklawa",
        items: [
          { label: "All products", to: "/shop" },
          { label: "Premium Baklawa", to: "/shop?category=premium-baklawa" },
          { label: "Kadayif Baklawa", to: "/shop?category=kadayif-baklawa" },
          { label: "Best Sellers", to: "/collections" },
          { label: "What’s New", to: "/collections" },
        ],
      },
      {
        title: "Dates & chocolates",
        items: [
          { label: "Arabic Dates", to: "/shop?category=arabic-dates" },
          { label: "Chocolates", to: "/shop?category=chocolates" },
          { label: "Fusion Sweets", to: "/shop?category=fusion-sweets" },
          { label: "Turkish Delight", to: "/shop?category=turkish-delight" },
        ],
      },
      {
        title: "More delicacies",
        items: [
          { label: "Nuts & Mixes", to: "/shop?category=nuts-and-mixes" },
          { label: "Assortment Gifts", to: "/shop?category=assortment-gifts" },
          { label: "Gift Hampers", to: "/shop?category=gift-hampers" },
          { label: "Luxury Gifting", to: "/shop?category=luxury-gifting" },
        ],
      },
    ],
  },
  {
    label: "Gifting",
    to: "/gifting",
    columns: [
      {
        title: "By occasion",
        items: [
          { label: "Premium Gifting", to: "/gifting" },
          { label: "Festive Gifting", to: "/gifting" },
          { label: "Casual Gifting", to: "/gifting" },
          { label: "Baby Shower Gifting", to: "/gifting" },
        ],
      },
      {
        title: "Celebrations",
        items: [
          { label: "Wedding Gifting", to: "/gifting" },
          { label: "Mehendi Gifting", to: "/gifting" },
          { label: "Corporate Gifting", to: "/corporate" },
          { label: "Dessert Catering", to: "/corporate" },
        ],
      },
      {
        title: "Tools",
        items: [
          { label: "Build a Gift", to: "/build-a-gift" },
          { label: "Gift Finder", to: "/gift-finder" },
          { label: "Gifting overview", to: "/gifting" },
        ],
      },
    ],
  },
  { label: "Our Story", to: "/about" },
  { label: "Our Production", to: "/business" },
  { label: "Stores", to: "/stores" },
  { label: "Journal", to: "/journal" },
  { label: "Contact", to: "/contact" },
];

/** Short service links shown at the foot of the mobile menu. */
export const serviceNav = [
  { label: "Track your order", to: "/track-order" },
  { label: "Shipping & delivery", to: "/shipping" },
  { label: "Help & FAQ", to: "/faq" },
  { label: "Saved items", to: "/wishlist" },
  { label: "Account", to: "/account" },
];

export const stores: Store[] = storeLocations.map((location) => ({
  id: location.id,
  name: `Oasis Baklawa — ${location.name}`,
  city: location.city,
  region: location.state,
  addressLines: location.addressLines,
  postalCode: location.postalCode,
  services: [],
  status: "open" as const,
}));

/** Verified customer reviews are not published yet, so none are shown. */
export const testimonials: Testimonial[] = [];

export const trustPoints = [
  {
    title: "Made in small batches",
    detail: "Production scheduled around orders rather than long storage.",
  },
  {
    title: "Selected ingredients",
    detail: "Nuts, butter and pastry chosen for the house recipes.",
  },
  { title: "Careful packing", detail: "Rigid boxes and inner trays to protect pieces in transit." },
  { title: "Gifting ready", detail: "Presentation packaging available across the range." },
];

export const capabilities: CorporateCapability[] = [
  {
    id: "c-wholesale",
    title: "Wholesale & Retail Supply",
    summary: "Supply for retailers, speciality grocers and gourmet counters.",
    points: [
      "Repeat order formats",
      "Case packing options",
      "Product specification sheets on request",
    ],
  },
  {
    id: "c-corporate",
    title: "Corporate Gifting",
    summary: "Gifting programmes for teams, clients and seasonal campaigns.",
    points: [
      "Consistent presentation across volume",
      "Card insert options",
      "Delivery coordination discussed per order",
    ],
  },
  {
    id: "c-custom",
    title: "Custom & Private Requirements",
    summary: "Bespoke formats and packaging discussed case by case.",
    points: [
      "Format and portioning options",
      "Packaging adaptations",
      "Feasibility confirmed before commitment",
    ],
  },
  {
    id: "c-horeca",
    title: "Hotels, Restaurants & Caterers",
    summary: "Formats suited to service, banqueting and events.",
    points: [
      "Tray and portion formats",
      "Planning around event dates",
      "Ongoing supply discussed on enquiry",
    ],
  },
];

export const b2bProcess = [
  { step: "01", title: "Enquiry", detail: "Share your requirement, volume and timeline." },
  {
    step: "02",
    title: "Range & samples",
    detail: "We propose a suitable range and discuss samples.",
  },
  { step: "03", title: "Quotation", detail: "Pricing and packing options confirmed in writing." },
  { step: "04", title: "Supply", detail: "Production scheduled and delivery coordinated." },
];

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Premium Baklawa", to: "/shop?category=premium-baklawa" },
      { label: "Arabic Dates", to: "/shop?category=arabic-dates" },
      { label: "Chocolates", to: "/shop?category=chocolates" },
      { label: "Nuts & Mixes", to: "/shop?category=nuts-and-mixes" },
      { label: "Saved items", to: "/wishlist" },
    ],
  },
  {
    title: "Gifting",
    links: [
      { label: "Gifting", to: "/gifting" },
      { label: "Build a gift", to: "/build-a-gift" },
      { label: "Gift finder", to: "/gift-finder" },
      { label: "Corporate gifting", to: "/corporate" },
      { label: "Our story", to: "/about" },
      { label: "Stores", to: "/stores" },
    ],
  },
  {
    title: "Service",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Track your order", to: "/track-order" },
      { label: "Shipping & delivery", to: "/shipping" },
      { label: "Help & FAQ", to: "/faq" },
      { label: "Account", to: "/account" },
      { label: "Returns", to: "/returns" },
    ],
  },
];

export const faqs: { category: string; items: { q: string; a: string }[] }[] = [
  {
    category: "Orders",
    items: [
      {
        q: "How do I place an order?",
        a: "Online ordering is being set up. In the meantime you can browse the range here and contact us directly to arrange an order.",
      },
      {
        q: "Can I order for a specific date?",
        a: "Date-based ordering will be supported once ordering goes live. For now, share your date when you enquire and we will confirm feasibility.",
      },
      {
        q: "Is there a minimum order?",
        a: "Retail minimums are not applied. Volume, corporate and wholesale requirements are discussed per enquiry.",
      },
    ],
  },
  {
    category: "Products & ingredients",
    items: [
      {
        q: "What is baklawa made from?",
        a: "Layered filo pastry, clarified butter and nuts, finished with syrup. Exact recipes vary by product and are listed on each product page.",
      },
      {
        q: "Do your products contain nuts?",
        a: "Most products contain nuts and are produced in a kitchen that handles nuts, dairy and gluten. Allergen details on each product page are placeholders until final specifications are published.",
      },
      {
        q: "How should products be stored?",
        a: "Storage guidance is shown on each product page. As a general rule, keep in a cool, dry place in the sealed box.",
      },
    ],
  },
  {
    category: "Delivery & gifting",
    items: [
      {
        q: "Where do you deliver?",
        a: "Delivery coverage will be confirmed when ordering goes live. Please enquire for current options.",
      },
      {
        q: "Can you send an order as a gift?",
        a: "Yes — presentation packaging is available across the range, and card inserts can be discussed for gifting and corporate orders.",
      },
      {
        q: "Do you handle corporate gifting at volume?",
        a: "Yes. Share volume, timeline and presentation requirements through the business enquiry form and we will respond with options.",
      },
    ],
  },
];

export const giftingServices = [
  {
    title: "Presentation packaging",
    detail: "Rigid boxes with inner trays, finished for handing over directly.",
  },
  {
    title: "Card inserts",
    detail: "Message cards can be included; formats to be confirmed per order.",
  },
  {
    title: "Multi-address sending",
    detail: "Splitting a single order across recipients is discussed per enquiry.",
  },
  {
    title: "Volume gifting",
    detail: "Repeatable presentation across larger quantities for teams and clients.",
  },
];

export const contactChannels = [
  {
    title: "Customer care",
    detail: "Products, orders and gifting.",
    value: contact.phone,
    href: contact.phoneHref,
  },
  {
    title: "Email",
    detail: "Written enquiries, quotes and corporate gifting.",
    value: contact.email,
    href: contact.emailHref,
  },
  {
    title: "Head office & production",
    detail: "TCF Chocolates & Gifts Pvt. Ltd.",
    value: contact.headOffice.lines.join(", "),
  },
];
