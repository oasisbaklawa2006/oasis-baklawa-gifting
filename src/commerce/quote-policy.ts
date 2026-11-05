/**
 * Server-side handoff guard. A URL, public catalogue or local subtotal is not a
 * verified commerce quote. A provider must explicitly attest to the quote and
 * account for exactly the requested product/variant quantities.
 */
import type { CartLineInput, PricedCart } from "./types";

const lineKey = (productId: string, variantId: string) => JSON.stringify([productId, variantId]);

export function isAuthoritativeOrderQuote(
  requested: readonly CartLineInput[],
  quote: PricedCart,
): boolean {
  if (!quote.authoritative || requested.length === 0 || quote.lines.length !== requested.length) {
    return false;
  }
  if (
    !Number.isFinite(quote.subtotal.amount) ||
    !Number.isFinite(quote.total.amount) ||
    quote.subtotal.amount < 0 ||
    quote.total.amount < 0 ||
    quote.subtotal.currency !== quote.total.currency
  ) {
    return false;
  }

  const requestedLines = new Map<string, number>();
  for (const line of requested) {
    if (!line.productId || !line.variantId || !Number.isInteger(line.quantity) || line.quantity <= 0) {
      return false;
    }
    const key = lineKey(line.productId, line.variantId);
    if (requestedLines.has(key)) return false;
    requestedLines.set(key, line.quantity);
  }

  for (const line of quote.lines) {
    const key = lineKey(line.productId, line.variantId);
    if (requestedLines.get(key) !== line.quantity) return false;
    if (
      !Number.isFinite(line.unitPrice.amount) ||
      !Number.isFinite(line.lineTotal.amount) ||
      line.unitPrice.amount < 0 ||
      line.lineTotal.amount < 0 ||
      line.unitPrice.currency !== quote.total.currency ||
      line.lineTotal.currency !== quote.total.currency
    ) {
      return false;
    }
    requestedLines.delete(key);
  }

  return requestedLines.size === 0;
}
