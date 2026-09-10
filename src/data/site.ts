import type { CorporateCapability, NavigationItem, Store, Testimonial } from "./types";
import { contact, storeLocations } from "./brand";

/** Site content. Brand facts, locations and contact details come from ./brand. */

export const announcements = [
  "Freshly made in small batches",
  "Gift boxing available on every order",
  "Corporate & wholesale enquiries welcome",
];

/**
 * Eight top-level departments. Mega-menu links are filter deep links into the
 * shared catalogue engine — they never create collections that do not exist.
 */
export const primaryNav: NavigationItem[] = [
  {
    label: "Luxury Gifts",
    to: "/luxury-gifts",
    columns: [
      {
        title: "By occasion",
        items: [
          { label: "Festive Gifting", to: "/luxury-gifts?occasion=Festive" },
          { label: "Wedding Gifting", to: "/wedding-gifting" },
          { label: "Mehendi Gifting", to: "/luxury-gifts?occasion=Mehendi" },
          { label: "Casual & Everyday", to: "/luxury-gifts?occasion=Casual" },
          { label: "Corporate Gifting", to: "/corporate" },
        ],
      },
      {
        title: "By gift type",
        items: [
          { label: "Premium Gifting", to: "/luxury-gifts?giftType=premium-gifting" },
          { label: "Assortment Gifts", to: "/luxury-gifts?giftType=assortment-gifts" },
          { label: "Gift Hampers", to: "/luxury-gifts?giftType=gift-hampers" },
          { label: "Baklawa Gift Boxes", to: "/baklawa?giftType=baklawa-gift-boxes" },
          { label: "Chocolate Gifts", to: "/gourmet-food?giftType=chocolate-gifts" },
        ],
      },
      {
        title: "By recipient & tools",
        items: [
          { label: "Family & Friends", to: "/luxury-gifts?recipient=family-friends" },
          { label: "Host / Thank You", to: "/luxury-gifts?recipient=host-thank-you" },
          { label: "Clients & Employees", to: "/luxury-gifts?recipient=clients-employees" },
          { label: "Gift Finder", to: "/gift-finder" },
          { label: "Build Your Own Box", to: "/build-your-box" },
        ],
      },
    ],
  },
  {
    label: "Baklawa",
    to: "/baklawa",
    columns: [
      {
        title: "Shop baklawa",
        items: [
          { label: "Shop All Baklawa", to: "/baklawa" },
          { label: "Premium Baklawa", to: "/baklawa?category=premium-baklawa" },
          { label: "Kadayif Baklawa", to: "/baklawa?category=kadayif-baklawa" },
        ],
      },
      {
        title: "Selections",
        items: [
          { label: "Baklawa Gift Boxes", to: "/baklawa?giftType=baklawa-gift-boxes" },
          { label: "Pistachio", to: "/baklawa?ingredient=Pistachio" },
          { label: "Walnut & Cashew", to: "/baklawa?ingredient=Walnut" },
        ],
      },
      {
        title: "The craft",
        items: [
          { label: "The art of baklawa", to: "/world-of-oasis" },
          { label: "Our production", to: "/business" },
          { label: "Journal", to: "/journal" },
        ],
      },
    ],
  },
  {
    label: "Gourmet Food",
    to: "/gourmet-food",
    columns: [
      {
        title: "Dates",
        items: [
          { label: "Arabic Dates", to: "/gourmet-food?category=arabic-dates" },
          { label: "Dates & Chocodates Gifts", to: "/gourmet-food?giftType=dates-gifts" },
          { label: "Dates in the range", to: "/gourmet-food?ingredient=Dates" },
        ],
      },
      {
        title: "Chocolates",
        items: [
          { label: "All Chocolates", to: "/gourmet-food?category=chocolates" },
          { label: "Chocolate Gifts", to: "/gourmet-food?giftType=chocolate-gifts" },
          { label: "Chocolate in the range", to: "/gourmet-food?ingredient=Chocolate" },
        ],
      },
      {
        title: "More delicacies",
        items: [
          { label: "Fusion Sweets", to: "/gourmet-food?category=fusion-sweets" },
          { label: "Turkish Delight", to: "/gourmet-food?category=turkish-delight" },
          { label: "Dry Fruit & Nuts", to: "/gourmet-food?category=nuts-and-mixes" },
          { label: "What’s New", to: "/gourmet-food?collection=col-seasonal" },
        ],
      },
    ],
  },
  { label: "Build Your Own Box", to: "/build-your-box" },
  { label: "Corporate Gifting", to: "/corporate" },
  { label: "Wedding Gifting", to: "/wedding-gifting" },
  {
    label: "World of Oasis",
    to: "/world-of-oasis",
    columns: [
      {
        title: "The house",
        items: [
          { label: "Our Story", to: "/about" },
          { label: "Our Production", to: "/business" },
          { label: "World of Oasis", to: "/world-of-oasis" },
        ],
      },
      {
        title: "Visit & read",
        items: [
          { label: "Stores", to: "/stores" },
          { label: "Journal", to: "/journal" },
          { label: "Contact Us", to: "/contact" },
        ],
      },
    ],
  },
  { label: "Oasis Rewards", to: "/rewards" },
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
