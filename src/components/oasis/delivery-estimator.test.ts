import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DeliveryEstimator } from "./delivery-estimator";

describe("uncertified shipping estimate hold", () => {
  it("does not emit mock arrival dates, route zones or a PIN quote form", () => {
    const html = renderToStaticMarkup(createElement(DeliveryEstimator));
    expect(html).toContain("not yet available online");
    expect(html).toContain('href="/contact"');
    expect(html).not.toContain("<form");
    expect(html).not.toContain("Arriving");
    expect(html).not.toContain("Dispatching today");
    expect(html).not.toContain("Zone A");
  });

  it("keeps the compact product-page delivery prompt informative but non-commercial", () => {
    const html = renderToStaticMarkup(createElement(DeliveryEstimator, { compact: true }));
    expect(html).toContain("Confirm delivery availability");
    expect(html).toContain("shipping charges");
    expect(html).not.toContain('type="submit"');
  });
});
