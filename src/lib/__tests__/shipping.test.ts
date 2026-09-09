import { describe, expect, it } from "vitest";

import { estimateDelivery, findZoneByPincode, serviceLevels } from "@/data/shipping";

describe("delivery eligibility", () => {
  it("returns null for an unserviced pincode rather than promising delivery", () => {
    expect(findZoneByPincode("000000")).toBeNull();
    expect(estimateDelivery("000000")).toBeNull();
  });

  it("only offers a service level the zone actually supports", () => {
    const zone = findZoneByPincode("110016");
    expect(zone).not.toBeNull();
    for (const service of serviceLevels) {
      const estimate = estimateDelivery("110016", service.id);
      if (!zone?.services.includes(service.id)) {
        expect(estimate).toBeNull();
      } else {
        expect(estimate?.service.id).toBe(service.id);
      }
    }
  });

  it("never returns a latest date before the earliest date", () => {
    const estimate = estimateDelivery("110016", "standard");
    expect(estimate).not.toBeNull();
    if (estimate) {
      expect(estimate.latest.getTime()).toBeGreaterThanOrEqual(estimate.earliest.getTime());
      expect(estimate.earliest.getTime()).toBeGreaterThanOrEqual(estimate.dispatchDate.getTime());
    }
  });
});
