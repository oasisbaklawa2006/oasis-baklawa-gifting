/**
 * Server-side handoff guard. A URL, public catalogue or local subtotal is not a
 * verified commerce quote. A provider must explicitly attest to the quote and
 * account for exactly the requested product/variant quantities.
 */
import type { CartLineInput, PricedCart } from "./types";

const lineKey = (productId: string, variantId: string) => JSON.stringify([productId, variantId]);

/**
 * Supported currencies INR, AED and USD have two fractional digits.
 * Reject fractional minor units and unsafe integer arithmetic; an authority
 * flag alone does not establish that the returned numbers reconcile.
 */
function toMinorUnits(amount: number): number | null {
  if (!Number.isFinite(amount) || amount < 0 || amount > Number.MAX_SAFE_INTEGER / 100) {
    return null;
  }
  const scaled = amount * 100;
  const rounded = Math.round(scaled);
  return Math.abs(scaled - rounded) <= 0.000001 ? rounded : null;
}

export function isAuthoritativeOrderQuote(
  requested: readonly CartLineInput[],
  quote: PricedCart,
): boolean {
  if (!quote.authoritative || requested.length === 0 || quote.lines.length !== requested.length) {
    return false;
  }
  const subtotalCents = toMinorUnits(quote.subtotal.amount);
  const totalCents = toMinorUnits(quote.total.amount);
  if (
    subtotalCents === null ||
    totalCents === null ||
    quote.subtotal.currency !== quote.total.currency
  ) {
    return false;
  }

  // There is no discount field in this contract. Any delivery or
  // personalisation fee must therefore be covered by the provider total.
  let minimumTotalCents = subtotalCents;
  for (const charge of [quote.delivery, quote.personalisation]) {
    if (!charge) continue;
    const cents = toMinorUnits(charge.amount);
    if (cents === null || charge.currency !== quote.total.currency) return false;
    minimumTotalCents += cents;
  }
  if (!Number.isSafeInteger(minimumTotalCents) || totalCents < minimumTotalCents) {
    return false;
  }
  // Tax may already be included in unit prices, but its amount and currency
  // still require contract validation when the provider reports it.
  if (
    quote.tax &&
    (toMinorUnits(quote.tax.amount) === null || quote.tax.currency !== quote.total.currency)
  ) {
    return false;
  }

  const requestedLines = new Map<string, number>();
  for (const line of requested) {
    if (
      !line.productId ||
      !line.variantId ||
      !Number.isSafeInteger(line.quantity) ||
      line.quantity <= 0
    ) {
      return false;
    }
    const key = lineKey(line.productId, line.variantId);
    if (requestedLines.has(key)) return false;
    requestedLines.set(key, line.quantity);
  }

  let calculatedSubtotalCents = 0;
  for (const line of quote.lines) {
    const key = lineKey(line.productId, line.variantId);
    if (requestedLines.get(key) !== line.quantity) return false;
    const unitPriceCents = toMinorUnits(line.unitPrice.amount);
    const lineTotalCents = toMinorUnits(line.lineTotal.amount);
    if (
      unitPriceCents === null ||
      lineTotalCents === null ||
      line.unitPrice.currency !== quote.total.currency ||
      line.lineTotal.currency !== quote.total.currency ||
      !Number.isSafeInteger(unitPriceCents * line.quantity) ||
      unitPriceCents * line.quantity !== lineTotalCents
    ) {
      return false;
    }
    calculatedSubtotalCents += lineTotalCents;
    if (!Number.isSafeInteger(calculatedSubtotalCents)) return false;
    requestedLines.delete(key);
  }

  return requestedLines.size === 0 && calculatedSubtotalCents === subtotalCents;
}
