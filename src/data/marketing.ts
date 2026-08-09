/**
 * Growth / distribution channels.
 *
 * TODO(oasis): paste the real destination URLs below. Any entry left as an
 * empty string is rendered as a neutral "link to be added" state instead of a
 * dead link, so nothing fabricated ships to search engines or customers.
 */

export type ChannelLink = {
  id: string;
  label: string;
  /** Empty string = not configured yet. */
  href: string;
  detail: string;
};

/** Marketplaces / third-party storefronts. */
export const marketplaceLinks: ChannelLink[] = [
  {
    id: "amazon",
    label: "Amazon",
    href: "",
    detail: "Shop selected boxes on our Amazon storefront",
  },
  {
    id: "flipkart",
    label: "Flipkart",
    href: "",
    detail: "Selected gifting formats, dispatched nationally",
  },
  {
    id: "swiggy",
    label: "Swiggy Instamart",
    href: "",
    detail: "Same-day trays in serviced cities",
  },
  {
    id: "zomato",
    label: "Zomato",
    href: "",
    detail: "Order from the nearest counter",
  },
];

/** Owned social / profile presence — the backbone of profile backlinks. */
export const socialLinks: ChannelLink[] = [
  { id: "instagram", label: "Instagram", href: "", detail: "Daily kitchen and packaging notes" },
  { id: "facebook", label: "Facebook", href: "", detail: "Meta page for updates and messaging" },
  { id: "whatsapp", label: "WhatsApp", href: "", detail: "Order and enquiry channel" },
  { id: "youtube", label: "YouTube", href: "", detail: "Craft and behind-the-counter films" },
  { id: "pinterest", label: "Pinterest", href: "", detail: "Gifting and table styling boards" },
  { id: "linkedin", label: "LinkedIn", href: "", detail: "Corporate gifting and wholesale" },
  { id: "x", label: "X", href: "", detail: "Announcements and store openings" },
];

/** Discovery / listing profiles that carry citations and map presence. */
export const discoveryLinks: ChannelLink[] = [
  {
    id: "google-business",
    label: "Google Business Profile",
    href: "",
    detail: "Hours, directions and reviews on Google Maps and Search",
  },
  {
    id: "google-merchant",
    label: "Google Shopping",
    href: "",
    detail: "Product listings surfaced in Shopping results",
  },
  {
    id: "apple-maps",
    label: "Apple Maps",
    href: "",
    detail: "Store locations for iPhone navigation",
  },
  {
    id: "justdial",
    label: "Local directories",
    href: "",
    detail: "Verified listings across Indian directory sites",
  },
];

/** Partnership routes that earn editorial links rather than buying them. */
export const partnershipTracks = [
  {
    id: "press",
    title: "Press & editorial",
    summary:
      "Product samples, high-resolution imagery and founder commentary for food, travel and gifting features.",
  },
  {
    id: "creators",
    title: "Creators & reviewers",
    summary:
      "Collaboration on tasting films, unboxing and recipe content, with honest attribution and no paid claims.",
  },
  {
    id: "affiliates",
    title: "Affiliate & referral",
    summary:
      "Trackable links for publishers, concierge services and gifting platforms. Terms shared on enquiry.",
  },
  {
    id: "retail",
    title: "Retail & hospitality",
    summary:
      "Stocking partnerships with delicatessens, hotels and airline lounges, listed on both partner sites.",
  },
];

/** Copy for the referral / loyalty teaser. Mechanics are not live in this build. */
export const referralProgramme = {
  eyebrow: "Share Oasis",
  title: "Refer a friend, share the tray",
  body: "Send someone their first box and we will note a thank-you against your next order. Programme mechanics are being finalised — register interest and we will confirm the details.",
};

export const socialProofPlaceholder =
  "Ratings, review counts and press mentions will appear here once verified sources are supplied.";
