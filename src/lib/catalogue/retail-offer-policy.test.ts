import { describe, expect, it } from "vitest";

import {
  canDisplayLiveRetailPrice,
  canEnableRetailOrdering,
  fixtureRetailEvidence,
  type RetailOfferEvidence,
} from "./retail-offer-policy";

const certifiedCore: RetailOfferEvidence = {
  source: "core",
  publicationApproved: true,
  priceVerified: true,
  availabilityVerified: true,
  checkoutCertified: true,
};

describe("GFT-100 retail offer provenance", () => {
  it("never publishes fixture prices or permits fixture ordering", () => {
    expect(canDisplayLiveRetailPrice(fixtureRetailEvidence)).toBe(false);
    expect(canEnableRetailOrdering(fixtureRetailEvidence)).toBe(false);
    expect(
      canEnableRetailOrdering({
        ...certifiedCore,
        source: "fixture",
      }),
    ).toBe(false);
  });

  it("fails closed when publication or price authority is absent", () => {
    expect(canDisplayLiveRetailPrice({ ...certifiedCore, publicationApproved: false })).toBe(false);
    expect(canDisplayLiveRetailPrice({ ...certifiedCore, priceVerified: false })).toBe(false);
    expect(canEnableRetailOrdering({ ...certifiedCore, publicationApproved: false })).toBe(false);
    expect(canEnableRetailOrdering({ ...certifiedCore, priceVerified: false })).toBe(false);
  });

  it("permits Core-backed price display without enabling an uncertified checkout", () => {
    const preview = { ...certifiedCore, checkoutCertified: false };
    expect(canDisplayLiveRetailPrice(preview)).toBe(true);
    expect(canEnableRetailOrdering(preview)).toBe(false);
    expect(canEnableRetailOrdering({ ...certifiedCore, availabilityVerified: false })).toBe(false);
  });

  it("enables ordering only when every Core commercial gate is verified", () => {
    expect(canDisplayLiveRetailPrice(certifiedCore)).toBe(true);
    expect(canEnableRetailOrdering(certifiedCore)).toBe(true);
  });
});
