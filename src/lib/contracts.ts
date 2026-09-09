/**
 * FUTURE INTERFACE BOUNDARIES — types only, no implementations.
 *
 * These describe the contracts the storefront will call once Oasis Central
 * (operational truth) and the governed catalogue snapshot (presentation
 * authority) are available. Nothing here is wired to a backend, and this file
 * must not become a second inventory or pricing authority.
 */

import type { Money, Product } from "@/data/types";

/* ---------- Catalogue authority (read-only snapshots) ---------- */

export type CatalogueSnapshot = {
  snapshotId: string;
  generatedAt: string;
  products: Product[];
};

export interface CatalogueSource {
  listProducts(): Promise<Product[]>;
  getProduct(slug: string): Promise<Product | null>;
  getSnapshotMeta(): Promise<Pick<CatalogueSnapshot, "snapshotId" | "generatedAt">>;
}

/* ---------- Gifting & personalisation ---------- */

export type GiftOptions = {
  message: string;
  ribbonId?: string;
  sealId?: string;
  /** Conceal prices and invoice slips inside the shipping parcel. */
  concealInvoice: boolean;
};

export type Recipient = {
  id: string;
  name: string;
  addressLines: string[];
  city: string;
  postalCode: string;
  country: string;
  phone?: string;
  gift?: GiftOptions;
};

export interface MultiRecipientGifting {
  /** Future bulk CSV/XLSX recipient import. No parser exists yet. */
  importRecipients(file: File): Promise<Recipient[]>;
  validateRecipients(rows: Recipient[]): Promise<{ valid: Recipient[]; errors: string[] }>;
}

/* ---------- Commerce (not connected) ---------- */

export type BusinessCheckoutProfile = {
  legalName: string;
  gstin?: string;
  placeOfSupply?: string;
  purchaseOrderRef?: string;
};

export type FulfilmentMode = "ship" | "bopis" | "scheduled" | "cold-chain";

export type FulfilmentIntent = {
  mode: FulfilmentMode;
  storeId?: string;
  scheduledFor?: string;
  coldChainRequired?: boolean;
};

export type CurrencyContext = {
  currency: Money["currency"];
  country: string;
  /** Delivered Duty Paid pricing for international destinations. */
  ddp: boolean;
};

export interface PaymentGateway {
  createIntent(input: { amount: Money; reference: string }): Promise<{ intentId: string }>;
  confirm(intentId: string): Promise<{ status: "succeeded" | "failed" | "pending" }>;
}

export interface CourierAllocator {
  allocate(input: {
    postalCode: string;
    intent: FulfilmentIntent;
  }): Promise<{ courier: string; eta: string }>;
}

export interface MarketplaceSync {
  pushListing(productId: string, channel: "amazon" | "flipkart" | "meta" | "google"): Promise<void>;
}

/* ---------- Identity ---------- */

export interface PasswordlessAuth {
  requestCode(identifier: string): Promise<void>;
  verifyCode(identifier: string, code: string): Promise<{ customerId: string }>;
}

/* ---------- Event orchestration ---------- */

export type DomainEvent =
  | { type: "cart.updated"; payload: { lineCount: number } }
  | { type: "gift.configured"; payload: GiftOptions }
  | { type: "enquiry.submitted"; payload: { channel: "corporate" | "contact" } };

export interface EventBus {
  publish(event: DomainEvent): Promise<void>;
}
