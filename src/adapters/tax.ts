/**
 * TAX / INVOICE / COMPLIANCE ADAPTER
 *
 * Legal tax truth is never computed in the browser. Totals shown at checkout
 * are quotes returned by the server commerce boundary, and the final tax and
 * GST invoice are issued by Oasis Central / native finance. No HSN code or
 * GST rate is invented here.
 */

import { registerAdapter, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type TaxLine = { code: string; label: string; amountMinor: number };

export type TaxQuote = {
  /** Authoritative source that produced this quote. */
  authority: "appverse" | "external";
  lines: TaxLine[];
  totalTaxMinor: number;
  placeOfSupply?: string;
};

export type InvoiceRef = {
  invoiceNumber: string;
  issuedAt: string;
  documentUrl?: string;
  irn?: string;
  ewayBillNumber?: string;
};

export interface TaxAdapter {
  readonly provider: string;
  quote(input: {
    subtotalMinor: number;
    placeOfSupply?: string;
    gstin?: string;
  }): Promise<AdapterResult<TaxQuote>>;
  issueInvoice(orderReference: string): Promise<AdapterResult<InvoiceRef>>;
  creditNote(orderReference: string, reason: string): Promise<AdapterResult<InvoiceRef>>;
  validateGstin(gstin: string): { formatValid: boolean; normalized: string };
}

/** Format check only — registration validity is confirmed by the tax authority. */
export function validateGstinFormat(gstin: string): { formatValid: boolean; normalized: string } {
  const normalized = gstin.trim().toUpperCase().replace(/\s+/g, "");
  const pattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return { formatValid: pattern.test(normalized), normalized };
}

export const appverseTax: TaxAdapter = {
  provider: "appverse",
  async quote() {
    return notConfigured<TaxQuote>(
      "appverse",
      "Tax is quoted by Oasis Central at checkout; the website never calculates it.",
    );
  },
  async issueInvoice() {
    return notConfigured<InvoiceRef>("appverse", "GST invoices are issued by Oasis Central.");
  },
  async creditNote() {
    return notConfigured<InvoiceRef>("appverse", "Credit notes are issued by Oasis Central.");
  },
  validateGstin: validateGstinFormat,
};

const externalTax: TaxAdapter = {
  ...appverseTax,
  provider: "external",
  async issueInvoice() {
    return notConfigured<InvoiceRef>(
      "external",
      "External e-invoicing is not configured. Required: EINVOICE_API_URL, EINVOICE_API_KEY.",
    );
  },
};

registerAdapter({
  id: "tax:appverse",
  domain: "tax",
  provider: "appverse",
  label: "Oasis Central / native finance (authority)",
  capabilities: ["tax-quote", "gst-invoice", "credit-note", "gstin-format-check"],
  requiredEnv: ["APPVERSE_BASE_URL", "APPVERSE_API_KEY"],
  fallback: "Checkout shows server-quoted totals only; invoices are issued after the order.",
  isFallback: true,
});

registerAdapter({
  id: "tax:external",
  domain: "tax",
  provider: "external",
  label: "External GST / e-invoice provider (optional)",
  capabilities: ["e-invoice", "irn", "eway-bill", "credit-note"],
  requiredEnv: ["EINVOICE_API_URL", "EINVOICE_API_KEY"],
  fallback: "Oasis Central finance issues the documents.",
});

export function taxAdapter(): TaxAdapter {
  const descriptor = resolveAdapter("tax");
  return descriptor?.provider === "external" ? externalTax : appverseTax;
}
