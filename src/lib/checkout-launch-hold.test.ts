import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { useShop } from "@/lib/store";
import { Route } from "@/routes/checkout";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
  Link: ({ children, to }: { children: ReactNode; to: string }) =>
    createElement("a", { href: to }, children),
  useNavigate: vi.fn(),
}));

vi.mock("@tanstack/react-start", () => ({ useServerFn: vi.fn() }));

vi.mock("@/lib/commerce.functions", () => ({
  placeOrder: vi.fn(),
  priceCart: vi.fn(),
}));

vi.mock("@/lib/store", () => ({
  cartSubtotal: vi.fn(),
  resolveLines: vi.fn(),
  useShop: vi.fn(() => {
    throw new Error("The checkout form must stay unmounted during the launch hold.");
  }),
}));

describe("checkout during the payment launch hold", () => {
  it("shows the ordering hold and a bag link without mounting the checkout form", () => {
    const Checkout = Route.options.component;
    if (typeof Checkout !== "function") throw new Error("Checkout route has no component.");

    const html = renderToStaticMarkup(createElement(Checkout));

    expect(html).toContain("Online ordering is currently unavailable");
    expect(html).toContain('href="/cart">Back to bag');
    expect(html).not.toContain('id="checkout-form"');
    expect(html).not.toContain("Place order");
    expect(useShop).not.toHaveBeenCalled();
  });
});
