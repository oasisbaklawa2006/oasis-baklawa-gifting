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
        title: "By format",
        items: [
          { label: "Trays & boxes", to: "/shop" },
          { label: "Small formats", to: "/shop" },
          { label: "Hampers", to: "/shop" },
        ],
      },
      {
        title: "Shop all",
        items: [
          { label: "All products", to: "/shop" },
          { label: "New arrivals", to: "/shop" },
          { label: "Best sellers", to: "/shop" },
        ],
      },
    ],
  },
  {
    label: "Collections",
    to: "/shop",
    columns: [
      {
        title: "Collections",
        items: [
          { label: "The Signature Collection", to: "/shop" },
          { label: "Gifting", to: "/shop" },
          { label: "New & Noteworthy", to: "/shop" },
          { label: "Corporate Selection", to: "/shop" },
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
    ],
  },
  { label: "Gifting", to: "/shop" },
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
      { label: "Gift boxes", to: "/shop" },
      { label: "Search", to: "/search" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Our story", to: "/about" },
      { label: "Stores", to: "/stores" },
      { label: "Corporate & B2B", to: "/business" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Contact", to: "/about" },
      { label: "Shipping information", to: "/about" },
      { label: "Allergen information", to: "/about" },
    ],
  },
];
