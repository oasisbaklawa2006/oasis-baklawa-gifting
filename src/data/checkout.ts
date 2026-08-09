/**
 * CHECKOUT, PAYMENTS & PERSONALISATION — mock configuration for UI work.
 * No payment gateway is connected in this build. Fees, methods and provider
 * names below are placeholders for layout and flow, not live commercial terms.
 */

import type { Money } from "@/data/types";

export type PaymentRegion = "india" | "international";

export type PaymentMethod = {
  id: string;
  name: string;
  /** Short helper line shown under the method name. */
  detail: string;
  region: PaymentRegion;
  /** Common brands/rails routed through this method (display only). */
  brands: string[];
  /** True when the method needs no card entry at checkout. */
  instant?: boolean;
};

export const paymentMethods: PaymentMethod[] = [
  {
    id: "upi",
    name: "UPI",
    detail: "Pay instantly from any UPI app or by scanning a QR code.",
    region: "india",
    brands: ["Google Pay", "PhonePe", "Paytm", "BHIM"],
    instant: true,
  },
  {
    id: "cards-in",
    name: "Credit & debit cards",
    detail: "Domestic Visa, Mastercard and RuPay cards, with saved-card support.",
    region: "india",
    brands: ["Visa", "Mastercard", "RuPay", "Amex"],
  },
  {
    id: "netbanking",
    name: "Net banking",
    detail: "Direct bank transfer through major Indian retail banks.",
    region: "india",
    brands: ["HDFC", "ICICI", "SBI", "Axis", "Kotak"],
  },
  {
    id: "wallets",
    name: "Wallets & pay later",
    detail: "Wallet balances and pay-later accounts where eligible.",
    region: "india",
    brands: ["Paytm", "Amazon Pay", "Mobikwik"],
  },
  {
    id: "emi",
    name: "EMI",
    detail: "Card and cardless instalments on larger corporate gifting orders.",
    region: "india",
    brands: ["Card EMI", "Cardless EMI"],
  },
  {
    id: "cod",
    name: "Cash on delivery",
    detail: "Available on selected city PIN codes and order values.",
    region: "india",
    brands: ["Cash", "UPI on delivery"],
  },
  {
    id: "cards-intl",
    name: "International cards",
    detail: "Cards issued outside India, charged in your local currency where supported.",
    region: "international",
    brands: ["Visa", "Mastercard", "Amex", "Discover"],
  },
  {
    id: "wallet-intl",
    name: "Express wallets",
    detail: "One-tap checkout using a device wallet.",
    region: "international",
    brands: ["Apple Pay", "Google Pay"],
    instant: true,
  },
  {
    id: "paypal",
    name: "PayPal",
    detail: "Pay with a PayPal balance or a linked card.",
    region: "international",
    brands: ["PayPal"],
    instant: true,
  },
  {
    id: "bank-intl",
    name: "Bank transfer",
    detail: "SWIFT or local bank transfer for wholesale and export orders.",
    region: "international",
    brands: ["SWIFT", "SEPA", "ACH"],
  },
];

/** Providers we expect to route through. Not connected in this build. */
export type PaymentProvider = {
  id: string;
  name: string;
  scope: string;
  covers: string[];
  status: "planned";
};

export const paymentProviders: PaymentProvider[] = [
  {
    id: "india-domestic",
    name: "Indian payment gateway",
    scope: "Domestic orders in INR",
    covers: ["UPI", "Cards", "Net banking", "Wallets", "EMI"],
    status: "planned",
  },
  {
    id: "international",
    name: "International payment gateway",
    scope: "Cross-border orders and multi-currency pricing",
    covers: ["International cards", "Apple Pay", "Google Pay", "PayPal"],
    status: "planned",
  },
  {
    id: "b2b",
    name: "B2B invoicing & transfer",
    scope: "Wholesale, export and corporate accounts",
    covers: ["Bank transfer", "Purchase orders", "Credit terms"],
    status: "planned",
  },
];

export const supportedCurrencies: { code: Money["currency"]; label: string; note: string }[] = [
  { code: "INR", label: "Indian Rupee", note: "Default pricing currency for orders within India." },
  { code: "AED", label: "UAE Dirham", note: "Displayed for Gulf customers; settled by the gateway." },
  { code: "USD", label: "US Dollar", note: "Displayed for other international customers." },
];

export const paymentAssurances = [
  {
    title: "Encrypted checkout",
    body: "Card and bank details are entered on the gateway's own hosted fields — never stored by us.",
  },
  {
    title: "Verified by the issuer",
    body: "Domestic cards use additional issuer authentication where the bank requires it.",
  },
  {
    title: "Traceable refunds",
    body: "Refunds are returned to the original payment method with a reference you can track.",
  },
  {
    title: "Invoices on request",
    body: "GST-compliant invoices and purchase-order billing for corporate accounts.",
  },
];

/* ---------------------------------------------------------------------- */
/* Delivery options & surcharges                                          */
/* ---------------------------------------------------------------------- */

export type DeliveryOption = {
  id: string;
  name: string;
  window: string;
  /** Surcharge added to the order subtotal (mock amount, INR). */
  fee: number;
  note: string;
  /** Free above this subtotal, when set. */
  freeAbove?: number;
  badge?: string;
};

export const deliveryOptions: DeliveryOption[] = [
  {
    id: "standard",
    name: "Standard delivery",
    window: "2–5 working days",
    fee: 149,
    freeAbove: 2500,
    note: "Insulated, tracked courier across serviceable PIN codes.",
  },
  {
    id: "express",
    name: "Express delivery",
    window: "1–2 working days",
    fee: 349,
    note: "Priority handling and the earliest available courier slot.",
  },
  {
    id: "same-day",
    name: "Same-day city delivery",
    window: "Today, if ordered before the city cut-off",
    fee: 499,
    note: "Hand-delivered from the nearest counter within store cities.",
    badge: "Extra charges apply",
  },
  {
    id: "timed",
    name: "Timed evening slot",
    window: "Chosen 2-hour window",
    fee: 699,
    note: "For gifting moments that need to land at a specific hour.",
    badge: "Extra charges apply",
  },
];

/* ---------------------------------------------------------------------- */
/* Personalisation                                                        */
/* ---------------------------------------------------------------------- */

export type PersonalisationOption = {
  id: string;
  name: string;
  description: string;
  fee: number;
};

export const personalisationOptions: PersonalisationOption[] = [
  {
    id: "message-card",
    name: "Handwritten message card",
    description: "Your message written on an ivory card and tucked under the lid.",
    fee: 0,
  },
  {
    id: "ribbon",
    name: "Silk ribbon & wax seal",
    description: "Finished with a hand-tied ribbon and an olive wax seal.",
    fee: 120,
  },
  {
    id: "sleeve",
    name: "Printed occasion sleeve",
    description: "An outer sleeve printed for the occasion — festive, wedding or thank you.",
    fee: 180,
  },
  {
    id: "branding",
    name: "Corporate branding",
    description: "Your logo on the sleeve and card for corporate gifting runs.",
    fee: 350,
  },
  {
    id: "no-invoice",
    name: "Gift mode",
    description: "Prices removed from the packing slip and the invoice emailed to you instead.",
    fee: 0,
  },
];

export const ribbonColours = [
  { id: "olive", name: "Oasis olive", hex: "#6F7658" },
  { id: "gold", name: "Antique gold", hex: "#C49A6C" },
  { id: "truffle", name: "Truffle", hex: "#655247" },
  { id: "sand", name: "Sand", hex: "#DCC8AF" },
];

/* ---------------------------------------------------------------------- */
/* Build-your-own hamper / box                                            */
/* ---------------------------------------------------------------------- */

export type HamperBox = {
  id: string;
  name: string;
  /** Number of selections the box holds. */
  slots: number;
  /** Box, liner and packing fee (mock amount, INR). */
  fee: number;
  description: string;
};

export const hamperBoxes: HamperBox[] = [
  {
    id: "petite",
    name: "Petite box",
    slots: 4,
    fee: 250,
    description: "Four selections in a compact ivory box — a considered thank you.",
  },
  {
    id: "signature",
    name: "Signature box",
    slots: 6,
    fee: 400,
    description: "Six selections with a fitted tray insert and ribbon finish.",
  },
  {
    id: "grand",
    name: "Grand hamper",
    slots: 9,
    fee: 650,
    description: "Nine selections presented in a lidded hamper for larger occasions.",
  },
];

export const hamperExtras: PersonalisationOption[] = [
  { id: "dates", name: "Medjool date layer", description: "A layer of stuffed dates under the sweets.", fee: 320 },
  { id: "coffee", name: "Arabic coffee sachets", description: "Cardamom coffee sachets for the table.", fee: 240 },
  { id: "tin", name: "Keepsake tin", description: "A reusable tin instead of the standard liner.", fee: 300 },
];

export const inr = (amount: number): Money => ({ amount, currency: "INR" });
