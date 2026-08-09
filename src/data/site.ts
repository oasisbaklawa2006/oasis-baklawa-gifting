import type { CorporateCapability, NavigationItem, Store, Testimonial } from "./types";

/** MOCK SITE CONTENT — replace with CMS-sourced content later. */

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
        title: "By category",
        items: [
          { label: "Baklawa", to: "/shop" },
          { label: "Pistachio Specialities", to: "/shop" },
          { label: "Arabic Sweets Assortments", to: "/shop" },
          { label: "Gift Boxes", to: "/shop" },
        ],
      },
      {
        title: "By occasion",
        items: [
          { label: "Festive", to: "/shop" },
          { label: "Hosting", to: "/shop" },
          { label: "Thank you", to: "/shop" },
        ],
      },
      {
        title: "Shop all",
        items: [
          { label: "All products", to: "/shop" },
          { label: "Build your own box", to: "/build-your-box" },
          { label: "Shipping & delivery", to: "/shipping" },
          { label: "Track your order", to: "/track-order" },
          { label: "Collections", to: "/collections" },
          { label: "Saved items", to: "/wishlist" },
        ],
      },
    ],
  },
  {
    label: "Collections",
    to: "/collections",
    columns: [
      {
        title: "Collections",
        items: [
          { label: "The Signature Collection", to: "/collections" },
          { label: "Gifting", to: "/collections" },
          { label: "New & Noteworthy", to: "/collections" },
          { label: "Corporate Selection", to: "/collections" },
        ],
      },
      {
        title: "Explore",
        items: [
          { label: "All collections", to: "/collections" },
          { label: "Gifting guide", to: "/gifting" },
          { label: "Journal", to: "/journal" },
        ],
      },
    ],
  },
  { label: "Gifting", to: "/gifting" },
  { label: "Build a Box", to: "/build-your-box" },
  { label: "Journal", to: "/journal" },
  { label: "Corporate & B2B", to: "/business" },
  { label: "Our Story", to: "/about" },
  { label: "Stores", to: "/stores" },
];

export const stores: Store[] = [
  {
    id: "s-1",
    name: "Oasis Baklawa — Flagship",
    city: "City name",
    region: "Region placeholder",
    addressLines: ["Address line one", "Address line two"],
    hours: "Opening hours to be confirmed",
    phone: "Contact number to be added",
    services: ["Counter service", "Gift boxing", "Click & collect (planned)"],
    status: "open",
  },
  {
    id: "s-2",
    name: "Oasis Baklawa — City Centre",
    city: "City name",
    region: "Region placeholder",
    addressLines: ["Address line one", "Address line two"],
    hours: "Opening hours to be confirmed",
    phone: "Contact number to be added",
    services: ["Counter service", "Gift boxing"],
    status: "open",
  },
  {
    id: "s-3",
    name: "Oasis Baklawa — Mall Kiosk",
    city: "City name",
    region: "Region placeholder",
    addressLines: ["Address line one"],
    hours: "Opening hours to be confirmed",
    phone: "Contact number to be added",
    services: ["Counter service"],
    status: "opening-soon",
  },
];

/**
 * Placeholder editorial notes. These are NOT customer testimonials and make no
 * claims — replace with verified quotes once collected.
 */
export const testimonials: Testimonial[] = [
  {
    id: "t-1",
    quote: "Customer quote placeholder — to be replaced with a verified review once collected.",
    attribution: "Name placeholder",
    context: "Review source to be confirmed",
  },
  {
    id: "t-2",
    quote: "Customer quote placeholder — to be replaced with a verified review once collected.",
    attribution: "Name placeholder",
    context: "Review source to be confirmed",
  },
  {
    id: "t-3",
    quote: "Customer quote placeholder — to be replaced with a verified review once collected.",
    attribution: "Name placeholder",
    context: "Review source to be confirmed",
  },
];

export const trustPoints = [
  { title: "Made in small batches", detail: "Production scheduled around orders rather than long storage." },
  { title: "Selected ingredients", detail: "Nuts, butter and pastry chosen for the house recipes." },
  { title: "Careful packing", detail: "Rigid boxes and inner trays to protect pieces in transit." },
  { title: "Gifting ready", detail: "Presentation packaging available across the range." },
];

export const capabilities: CorporateCapability[] = [
  {
    id: "c-wholesale",
    title: "Wholesale & Retail Supply",
    summary: "Supply for retailers, speciality grocers and gourmet counters.",
    points: ["Repeat order formats", "Case packing options", "Product specification sheets on request"],
  },
  {
    id: "c-corporate",
    title: "Corporate Gifting",
    summary: "Gifting programmes for teams, clients and seasonal campaigns.",
    points: ["Consistent presentation across volume", "Card insert options", "Delivery coordination discussed per order"],
  },
  {
    id: "c-custom",
    title: "Custom & Private Requirements",
    summary: "Bespoke formats and packaging discussed case by case.",
    points: ["Format and portioning options", "Packaging adaptations", "Feasibility confirmed before commitment"],
  },
  {
    id: "c-horeca",
    title: "Hotels, Restaurants & Caterers",
    summary: "Formats suited to service, banqueting and events.",
    points: ["Tray and portion formats", "Planning around event dates", "Ongoing supply discussed on enquiry"],
  },
];

export const b2bProcess = [
  { step: "01", title: "Enquiry", detail: "Share your requirement, volume and timeline." },
  { step: "02", title: "Range & samples", detail: "We propose a suitable range and discuss samples." },
  { step: "03", title: "Quotation", detail: "Pricing and packing options confirmed in writing." },
  { step: "04", title: "Supply", detail: "Production scheduled and delivery coordinated." },
];

export const footerColumns = [
  {
    title: "Shop",
    links: [
      { label: "All products", to: "/shop" },
      { label: "Collections", to: "/collections" },
      { label: "Gifting", to: "/gifting" },
      { label: "Build your own box", to: "/build-your-box" },
      { label: "Saved items", to: "/wishlist" },
      { label: "Search", to: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", to: "/about" },
      { label: "Journal", to: "/journal" },
      { label: "Stores", to: "/stores" },
      { label: "Corporate & B2B", to: "/business" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", to: "/contact" },
      { label: "Shipping & delivery", to: "/shipping" },
      { label: "Payment options", to: "/payment-options" },
      { label: "Track your order", to: "/track-order" },
      { label: "FAQ", to: "/faq" },
      { label: "Your bag", to: "/cart" },
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
    detail: "Questions about products, orders and gifting.",
    value: "Email address to be added",
  },
  {
    title: "Corporate & wholesale",
    detail: "Volume supply, retail listings and gifting programmes.",
    value: "Email address to be added",
  },
  {
    title: "Press & partnerships",
    detail: "Media requests and collaboration proposals.",
    value: "Email address to be added",
  },
];
