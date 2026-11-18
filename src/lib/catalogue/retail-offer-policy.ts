/**
 * A fixture catalogue is never price or inventory authority. All customer-facing
 * commercial offers must be backed by an approved Core retail publication.
 *
 * This is intentionally distinct from the payment provider configuration:
 * providing gateway credentials must not promote demo products to saleable stock.
 */
export type RetailOfferEvidence = Readonly<{
  source: "fixture" | "core";
  publicationApproved: boolean;
  priceVerified: boolean;
  availabilityVerified: boolean;
  checkoutCertified: boolean;
}>;

/** Existing local data/catalog.ts products; not proof of a live Core offer. */
export const fixtureRetailEvidence: RetailOfferEvidence = {
  source: "fixture",
  publicationApproved: false,
  priceVerified: false,
  availabilityVerified: false,
  checkoutCertified: false,
};

export function canDisplayLiveRetailPrice(evidence: RetailOfferEvidence): boolean {
  return (
    evidence.source === "core" &&
    evidence.publicationApproved &&
    evidence.priceVerified
  );
}

export function canEnableRetailOrdering(evidence: RetailOfferEvidence): boolean {
  return (
    canDisplayLiveRetailPrice(evidence) &&
    evidence.availabilityVerified &&
    evidence.checkoutCertified
  );
}
