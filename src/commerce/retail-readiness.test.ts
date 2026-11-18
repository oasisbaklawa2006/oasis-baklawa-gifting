import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAX_READINESS_AGE_MS,
  RETAIL_ACTIONS,
  decideRetailAction,
  retailActionAllowed,
  retailReadinessSchema,
} from "./retail-readiness";

const NOW = new Date("2026-11-19T10:00:00.000Z");
const empty = {
  allowed: false,
  missing: [] as string[],
  unapproved: [] as string[],
  invalid: [] as string[],
};
const ok = { ...empty, allowed: true };

function readiness(over: Record<string, unknown> = {}) {
  return {
    contractVersion: 1,
    architectureStatus: "approved",
    activated: true,
    actions: { quote: ok, order: ok, payment: ok, refund: ok },
    evaluatedAt: NOW.toISOString(),
    ...over,
  };
}

describe("retail readiness (pending owner approval, not wired to checkout)", () => {
  it("allows an action only for a fresh, approved, activated, complete answer", () => {
    for (const action of RETAIL_ACTIONS) {
      expect(decideRetailAction(action, readiness(), { now: NOW })).toEqual({ allowed: true });
    }
  });

  it("blocks everything when Core's default answer says the architecture is pending", () => {
    const initial = readiness({
      architectureStatus: "pending_owner_approval",
      activated: false,
      actions: {
        quote: {
          allowed: false,
          missing: ["architecture_approved", "activation_enabled", "tax.price_display_mode"],
          unapproved: [],
          invalid: [],
        },
        order: { ...empty, missing: ["architecture_approved"] },
        payment: { ...empty, missing: ["payment.provider"] },
        refund: { ...empty, missing: ["refund.window_hours"] },
      },
    });
    for (const action of RETAIL_ACTIONS) {
      const decision = decideRetailAction(action, initial, { now: NOW });
      expect(decision.allowed).toBe(false);
    }
    expect(decideRetailAction("quote", initial, { now: NOW })).toMatchObject({
      reason: "architecture_pending_owner_approval",
      blockers: expect.arrayContaining(["tax.price_display_mode"]),
    });
  });

  it("names the exact missing, unapproved and invalid settings for the affected action only", () => {
    const partial = readiness({
      actions: {
        quote: ok,
        order: {
          allowed: false,
          missing: ["checkout.guest_allowed"],
          unapproved: ["shipping.model"],
          invalid: ["stock.reservation_minutes<quote.validity_minutes"],
        },
        payment: ok,
        refund: ok,
      },
    });
    expect(decideRetailAction("quote", partial, { now: NOW })).toEqual({ allowed: true });
    expect(decideRetailAction("order", partial, { now: NOW })).toEqual({
      allowed: false,
      reason: "settings_incomplete",
      blockers: [
        "checkout.guest_allowed",
        "shipping.model",
        "stock.reservation_minutes<quote.validity_minutes",
      ],
    });
  });

  it("blocks when approved but not activated, and when activated without approval", () => {
    expect(
      decideRetailAction("quote", readiness({ activated: false }), { now: NOW }),
    ).toMatchObject({ reason: "not_activated" });
    expect(
      decideRetailAction("quote", readiness({ architectureStatus: "pending_owner_approval" }), {
        now: NOW,
      }),
    ).toMatchObject({
      reason: "architecture_pending_owner_approval",
    });
  });

  it("does not trust an action flag that contradicts its own blockers", () => {
    const lying = readiness({
      actions: {
        quote: { ...ok, missing: ["shipping.model"] },
        order: ok,
        payment: ok,
        refund: ok,
      },
    });
    expect(decideRetailAction("quote", lying, { now: NOW })).toMatchObject({
      allowed: false,
      reason: "readiness_inconsistent",
    });
  });

  it("fails closed on anything it cannot parse", () => {
    for (const bad of [
      undefined,
      null,
      "ok",
      42,
      [],
      {},
      readiness({ contractVersion: 2 }),
      readiness({ activated: "yes" }),
      readiness({ actions: { quote: ok } }),
      readiness({ architectureStatus: "maybe" }),
    ]) {
      expect(decideRetailAction("quote", bad, { now: NOW })).toEqual({
        allowed: false,
        reason: "readiness_unavailable",
        blockers: [],
      });
    }
  });

  it("treats a stale or future-dated answer as unavailable", () => {
    const old = new Date(NOW.getTime() - DEFAULT_MAX_READINESS_AGE_MS - 1).toISOString();
    expect(
      decideRetailAction("quote", readiness({ evaluatedAt: old }), { now: NOW }),
    ).toMatchObject({ reason: "readiness_stale" });
    const future = new Date(NOW.getTime() + 60_000).toISOString();
    expect(
      decideRetailAction("quote", readiness({ evaluatedAt: future }), { now: NOW }),
    ).toMatchObject({ reason: "readiness_stale" });
    expect(
      decideRetailAction("quote", readiness({ evaluatedAt: "not a date" }), { now: NOW }),
    ).toMatchObject({ reason: "readiness_stale" });
    const recent = new Date(NOW.getTime() - 30_000).toISOString();
    expect(decideRetailAction("quote", readiness({ evaluatedAt: recent }), { now: NOW })).toEqual({
      allowed: true,
    });
  });

  it("blocks when the reference clock or the age limit is not a finite number", () => {
    const stale = new Date(NOW.getTime() - 86_400_000).toISOString();
    expect(
      decideRetailAction("quote", readiness({ evaluatedAt: stale }), { now: new Date(Number.NaN) }),
    ).toMatchObject({ allowed: false, reason: "readiness_stale" });
    for (const maxAgeMs of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      expect(
        decideRetailAction("quote", readiness({ evaluatedAt: stale }), { now: NOW, maxAgeMs }),
      ).toMatchObject({ allowed: false, reason: "readiness_stale" });
    }
    const recent = new Date(NOW.getTime() - 30_000).toISOString();
    expect(
      decideRetailAction("quote", readiness({ evaluatedAt: recent }), { now: NOW, maxAgeMs: 45_000 }),
    ).toEqual({ allowed: true });
  });

  it("rejects unknown actions even when the answer is fully approved", () => {
    for (const action of ["refunds", "", "__proto__", "constructor", "teleport"]) {
      expect(decideRetailAction(action, readiness(), { now: NOW })).toMatchObject({
        allowed: false,
        reason: "unknown_action",
      });
    }
    expect(retailActionAllowed("quote", readiness(), { now: NOW })).toBe(true);
    expect(retailActionAllowed("nope", readiness(), { now: NOW })).toBe(false);
  });

  it("accepts exactly the response shape Core documents", () => {
    expect(retailReadinessSchema.safeParse(readiness()).success).toBe(true);
  });
});
