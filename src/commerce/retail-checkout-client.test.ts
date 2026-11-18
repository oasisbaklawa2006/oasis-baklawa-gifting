import { describe, expect, it, vi } from "vitest";

import {
  createRetailCheckoutClient,
  describeInclusivePrice,
  paymentIntentSchema,
  razorpayCheckoutOptions,
} from "./retail-checkout-client";

const NOW = new Date("2026-11-19T10:00:00.000Z");
const UUID = "6f1c1c58-5b7e-4a0e-9d6c-1f2a3b4c5d6e";
const TOKEN = `rsess_${"a".repeat(64)}`;

const allowedActions = { allowed: true, missing: [], unapproved: [], invalid: [] };
const readiness = (over: Record<string, unknown> = {}) => ({
  contractVersion: 1,
  architectureStatus: "approved",
  activated: true,
  actions: {
    quote: allowedActions,
    order: allowedActions,
    payment: allowedActions,
    refund: allowedActions,
  },
  evaluatedAt: new Date(NOW.getTime() - 5_000).toISOString(),
  ...over,
});

const quoteBody = {
  quoteId: UUID,
  currency: "INR",
  priceDisplayMode: "inclusive",
  lines: [],
  shipping: {
    feeInclusive: 59,
    gstRatePercent: 18,
    taxableValue: 50,
    tax: { cgst: 4.5, sgst: 4.5, igst: 0 },
  },
  totals: {
    inclusiveTotal: 387,
    taxableTotal: 350,
    taxTotal: 37,
    cgst: 18.5,
    sgst: 18.5,
    igst: 0,
    supply: "intra_state",
  },
  expiresAt: "2026-11-19T10:15:00Z",
};

function client(over: { readiness?: unknown; fetchImpl?: typeof fetch } = {}) {
  const fetchImpl =
    over.fetchImpl ??
    (vi.fn(async () => new Response(JSON.stringify(quoteBody))) as unknown as typeof fetch);
  return {
    fetchImpl,
    api: createRetailCheckoutClient({
      baseUrl: "https://core.example.test/functions/v1/retail-checkout/",
      fetchImpl,
      readiness: () => ("readiness" in over ? over.readiness : readiness()),
      now: () => NOW,
    }),
  };
}

describe("retail checkout client (sandbox, not wired)", () => {
  it("sends nothing when Core readiness does not allow the action", async () => {
    for (const unavailable of [
      undefined,
      null,
      "oops",
      readiness({ activated: false }),
      readiness({ architectureStatus: "pending_owner_approval" }),
    ]) {
      const { api, fetchImpl } = client({ readiness: unavailable });
      const result = await api.quote(TOKEN, {});
      expect(result).toMatchObject({ ok: false, kind: "blocked" });
      expect(fetchImpl).not.toHaveBeenCalled();
    }
  });

  it("blocks per action: a blocked order does not stop a read-only price display", async () => {
    const blocked = readiness({
      actions: {
        quote: allowedActions,
        order: { ...allowedActions, allowed: false, missing: ["stock.reservation_minutes"] },
        payment: allowedActions,
        refund: allowedActions,
      },
    });
    const { api, fetchImpl } = client({
      readiness: blocked,
      fetchImpl: vi.fn(
        async () =>
          new Response(
            JSON.stringify({ priceDisplayMode: "inclusive", currency: "INR", items: [] }),
          ),
      ) as unknown as typeof fetch,
    });
    expect(await api.order(TOKEN, UUID, UUID)).toMatchObject({ ok: false, kind: "blocked" });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(await api.priceDisplay([UUID])).toMatchObject({ ok: true });
  });

  it("posts the request with the guest session as bearer and validates the quote", async () => {
    const { api, fetchImpl } = client();
    const result = await api.quote(TOKEN, { idempotencyKey: UUID });
    expect(result).toMatchObject({ ok: true, data: { quoteId: UUID } });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(url).toBe("https://core.example.test/functions/v1/retail-checkout/quote");
    expect((init as RequestInit).headers).toMatchObject({ authorization: `Bearer ${TOKEN}` });
  });

  it("rejects a malformed Core response instead of trusting it", async () => {
    const { api } = client({
      fetchImpl: vi.fn(
        async () => new Response(JSON.stringify({ ...quoteBody, priceDisplayMode: "exclusive" })),
      ) as unknown as typeof fetch,
    });
    expect(await api.quote(TOKEN, {})).toMatchObject({ ok: false, kind: "invalid_response" });
  });

  it("surfaces Core's refusal code without inventing a fallback", async () => {
    const { api } = client({
      fetchImpl: vi.fn(
        async () => new Response(JSON.stringify({ error: "commerce_blocked" }), { status: 409 }),
      ) as unknown as typeof fetch,
    });
    expect(await api.quote(TOKEN, {})).toEqual({
      ok: false,
      kind: "http",
      status: 409,
      error: "commerce_blocked",
    });
  });

  it("reports network faults as such, never as success", async () => {
    const { api } = client({
      fetchImpl: vi.fn(async () => {
        throw new Error("down");
      }) as unknown as typeof fetch,
    });
    expect(await api.quote(TOKEN, {})).toEqual({ ok: false, kind: "network" });
  });

  it("treats a live Razorpay key as an invalid response (sandbox only)", () => {
    const base = { razorpayOrderId: "order_TESTAAAA0001", amountPaise: 38700, currency: "INR" };
    expect(paymentIntentSchema.safeParse({ ...base, keyId: "rzp_live_abc" }).success).toBe(false);
    expect(paymentIntentSchema.safeParse({ ...base, keyId: "rzp_test_abc" }).success).toBe(true);
    expect(razorpayCheckoutOptions({ ...base, keyId: "rzp_test_abc", currency: "INR" })).toEqual({
      key: "rzp_test_abc",
      order_id: "order_TESTAAAA0001",
      amount: 38700,
      currency: "INR",
    });
  });

  it("session creation sends only the widget token, and it needs the order action to be allowed", async () => {
    const { api, fetchImpl } = client({
      fetchImpl: vi.fn(
        async () => new Response(JSON.stringify({ sessionToken: TOKEN, expiresAt: "x" })),
      ) as unknown as typeof fetch,
    });
    expect(await api.startSession("widget-token")).toMatchObject({ ok: true });
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0]!;
    expect(JSON.parse(String((init as RequestInit).body))).toEqual({ accessToken: "widget-token" });
    const blocked = client({ readiness: readiness({ activated: false }) });
    expect(await blocked.api.startSession("widget-token")).toMatchObject({
      ok: false,
      kind: "blocked",
    });
  });

  it("formats GST-inclusive text from Core numbers only", () => {
    expect(describeInclusivePrice(105, 5)).toBe("₹105.00 (inclusive of GST ₹5.00)");
    expect(describeInclusivePrice(1180.5, 180.08)).toBe("₹1,180.50 (inclusive of GST ₹180.08)");
  });
});
