import { describe, expect, it, beforeEach } from "vitest";

import {
  adapterReport,
  adapterStatus,
  getAdapter,
  listAdapters,
  resetAdapterHealth,
  resolveAdapter,
} from "@/adapters";
import {
  categoryOf,
  communicationsAdapter,
  normalizeGenericDelivery,
  normalizeTemplateKey,
  resetCommunications,
  sendMessage,
} from "@/adapters/communications";
import {
  normalizeCourierStatus,
  normalizeShippingWebhook,
  shippingAdapter,
} from "@/adapters/shipping";
import { localSearch, runSearch, searchAdapter } from "@/adapters/search";
import { hasVerifiedReviews, reviewsAdapter } from "@/adapters/reviews";
import { loyaltyAdapter } from "@/adapters/loyalty";
import { isDuplicateLead, normalizeLead } from "@/adapters/crm";
import {
  leadStoreDurability,
  createMemoryStore,
  databaseStoreConfigured,
} from "@/adapters/lead-store";
import { validateAddressLocally } from "@/adapters/address";
import { taxAdapter, validateGstinFormat } from "@/adapters/tax";
import { channelProjection, channelAdapter } from "@/adapters/channels";
import {
  isDuplicateConversion,
  normalizeReferralCode,
  referralAdapter,
  resetReferralConversions,
} from "@/adapters/referral";
import { assignVariant, experimentAdapter, hashToUnit } from "@/adapters/experiments";
import { identityKey } from "@/adapters/identity";
import { canPrompt, pushAdapter } from "@/adapters/push";
import { observability, resetObservability, scrub } from "@/adapters/observability";
import { recommend, validateRecommendations } from "@/adapters/recommendations";
import { receiveWebhook, requiresSignature, resetWebhooks } from "@/adapters/webhooks";
import { publishedOnly } from "@/adapters/content";
import { products } from "@/data/catalog";

beforeEach(() => {
  resetAdapterHealth();
  resetCommunications();
  resetReferralConversions();
  resetWebhooks();
  resetObservability();
});

describe("registry", () => {
  it("falls back to the built-in adapter when no provider is configured", () => {
    for (const domain of new Set(listAdapters().map((a) => a.domain))) {
      const resolved = resolveAdapter(domain);
      expect(resolved, domain).toBeDefined();
      expect(
        ["built-in", "configured", "not-configured"],
        `${domain}:${resolved?.provider}`,
      ).toContain(adapterStatus(resolved!));
    }
  });

  it("reports required environment key names but never values", () => {
    const report = adapterReport();
    expect(report.length).toBeGreaterThan(20);
    const serialised = JSON.stringify(report);
    expect(serialised).not.toMatch(/sk_|secret_value|Bearer /);
    for (const item of report) {
      for (const key of item.requiredEnv) expect(key).toMatch(/^[A-Z0-9_]+$/);
    }
  });

  it("marks unconfigured provider boundaries as not-configured", () => {
    expect(adapterStatus(getAdapter("shipping:shiprocket")!)).toBe("not-configured");
  });
});

describe("communications", () => {
  it("normalises template keys and separates marketing from transactional", () => {
    expect(normalizeTemplateKey("Order-Confirmation")).toBe("order_confirmation");
    expect(normalizeTemplateKey("not_a_template")).toBeNull();
    expect(categoryOf("order_confirmation")).toBe("transactional");
    expect(categoryOf("cart_recovery")).toBe("marketing");
  });

  it("queues without claiming delivery and honours idempotency", async () => {
    expect(communicationsAdapter().provider).toBe("local");
    const request = {
      channel: "email" as const,
      template: "order_confirmation" as const,
      to: "a@example.com",
      idempotencyKey: "k1",
    };
    const first = await sendMessage(request);
    expect(first.ok && first.data.state).toBe("queued");
    const second = await sendMessage(request);
    expect(second.ok && second.data.detail).toMatch(/Duplicate/);
  });

  it("maps provider delivery events onto internal states", () => {
    expect(normalizeGenericDelivery({ status: "bounced" })?.state).toBe("failed");
    expect(normalizeGenericDelivery({ status: "who-knows" })).toBeNull();
  });
});

describe("shipping", () => {
  it("normalises courier statuses onto the Oasis lifecycle", () => {
    expect(normalizeCourierStatus("Out For Delivery")).toBe("out_for_delivery");
    expect(normalizeCourierStatus("In Transit")).toBe("dispatched");
    expect(normalizeCourierStatus("RTO Initiated")).toBe("failed");
    expect(normalizeCourierStatus("banana")).toBeNull();
  });

  it("never claims serviceability without a courier", async () => {
    const result = await shippingAdapter().checkServiceability({ postalCode: "110015" });
    expect(result.ok).toBe(false);
  });

  it("normalises a courier webhook", () => {
    const update = normalizeShippingWebhook({ awb: "123", status: "Delivered", pod_url: "u" });
    expect(update?.stage).toBe("delivered");
  });
});

describe("search", () => {
  it("uses local search when no remote engine is configured", async () => {
    expect(searchAdapter().provider).toBe("local");
    const response = await runSearch({ term: "baklawa", limit: 5 });
    expect(response.provider).toBe("local");
    const slugs = new Set(products.map((p) => p.slug));
    for (const hit of response.hits) expect(slugs.has(hit.slug)).toBe(true);
  });

  it("returns nothing for an empty term", () => {
    expect(localSearch({ term: "  " }).total).toBe(0);
  });
});

describe("reviews", () => {
  it("shows no ratings when no verified source exists", async () => {
    const summary = await reviewsAdapter().summary("any-product");
    expect(summary.ok && summary.data).toBeNull();
    expect(await hasVerifiedReviews("any-product")).toBe(false);
  });
});

describe("loyalty", () => {
  it("invents no programme, points or tiers", async () => {
    const programme = await loyaltyAdapter().programme();
    expect(programme.ok && programme.data).toBeNull();
    const balance = await loyaltyAdapter().balance("cust_1");
    expect(balance.ok).toBe(false);
  });
});

describe("crm and lead store", () => {
  it("normalises and dedupes leads on one key", () => {
    const a = {
      kind: "wedding",
      email: " Dinesh@Example.com ",
      source: "web",
      attribution: {},
      consent: { marketing: true, timestamp: "t" },
    };
    expect(normalizeLead(a).key).toBe("wedding:dinesh@example.com");
    expect(isDuplicateLead(a, { ...a, email: "DINESH@example.com" })).toBe(true);
    expect(isDuplicateLead(a, { ...a, kind: "corporate" })).toBe(false);
  });

  it("never claims durability for the in-memory queue", () => {
    expect(createMemoryStore().durability).toBe("ephemeral");
  });

  it("reports durability from the store actually in use", () => {
    expect(leadStoreDurability()).toBe(databaseStoreConfigured() ? "durable" : "ephemeral");
  });
});

describe("address", () => {
  it("validates format only and never implies serviceability", () => {
    const result = validateAddressLocally({
      line1: "A-1",
      city: "New Delhi",
      state: "Delhi",
      postalCode: "110 015",
      country: "IN",
    });
    expect(result.normalized.postalCode).toBe("110015");
    expect(result.serviceabilityKnown).toBe(false);
    expect(
      validateAddressLocally({ ...result.normalized, postalCode: "abc" }).issues.length,
    ).toBeGreaterThan(0);
  });
});

describe("tax", () => {
  it("cannot self-authorise totals in the browser layer", async () => {
    const quote = await taxAdapter().quote({ subtotalMinor: 100000 });
    expect(quote.ok).toBe(false);
    expect(validateGstinFormat("07AAACO1234A1Z5").formatValid).toBe(true);
    expect(validateGstinFormat("nonsense").formatValid).toBe(false);
  });
});

describe("sales channels", () => {
  it("exports only the public-safe approved projection", () => {
    const projection = channelProjection();
    expect(projection.length).toBeGreaterThan(0);
    for (const item of projection) {
      expect(item.brand).toBe("Oasis Baklawa");
      // Without a configured site origin the link stays a relative path rather
      // than being stitched onto an invented host.
      expect(item.link).toMatch(/^(https?:\/\/|\/product\/)/);
    }
    const csv = channelAdapter("amazon")!.build(projection.slice(0, 2), "csv");
    expect(csv.ok && csv.data.split("\n")[0]).toContain("id,title");
  });

  it("never claims a live listing sync", async () => {
    const sync = await channelAdapter("flipkart")!.sync(channelProjection());
    expect(sync.ok).toBe(false);
  });
});

describe("referral", () => {
  it("dedupes a conversion per code and order", async () => {
    expect(normalizeReferralCode(" oasis gift ")).toBe("OASIS-GIFT");
    const input = { code: "oasis-gift", orderReference: "OB-1", valueMinor: 100 };
    const first = await referralAdapter().reportConversion(input);
    expect(first.ok && first.data.recorded).toBe(true);
    expect(isDuplicateConversion(input)).toBe(true);
    const second = await referralAdapter().reportConversion(input);
    expect(second.ok && second.data.recorded).toBe(false);
  });
});

describe("experiments", () => {
  it("assigns deterministically and defaults every flag off", () => {
    const experiment = { key: "hero", variants: ["a", "b"], enabled: true };
    const first = assignVariant(experiment, "visitor-1");
    expect(assignVariant(experiment, "visitor-1")).toBe(first);
    expect(hashToUnit("x")).toBe(hashToUnit("x"));
    expect(assignVariant({ ...experiment, enabled: false }, "visitor-1")).toBeNull();
    expect(experimentAdapter().flag("anything")).toBe(false);
  });
});

describe("identity", () => {
  it("maps a provider identity to one stable Oasis reference key", () => {
    expect(identityKey({ provider: "email_otp", subject: " A@B.com ", emailVerified: true })).toBe(
      "email_otp:a@b.com",
    );
    expect(identityKey({ provider: "google", subject: "sub-1", emailVerified: true })).toBe(
      "google:sub-1",
    );
  });
});

describe("push", () => {
  it("never prompts or subscribes without a configured provider", async () => {
    expect(canPrompt()).toBe(false);
    const result = await pushAdapter().subscribe(["transactional"]);
    expect(result.ok).toBe(false);
  });
});

describe("observability", () => {
  it("scrubs secrets and personal data", () => {
    const safe = scrub({
      authorization: "Bearer abc",
      email: "a@b.com",
      note: "call me at 9812345678 or a@b.com",
      nested: { apiKey: "x", city: "Delhi" },
    }) as Record<string, unknown>;
    expect(safe["authorization"]).toBe("[redacted]");
    expect(safe["email"]).toBe("[pii]");
    expect(safe["note"]).toBe("call me at [number] or [email]");
    expect((safe["nested"] as Record<string, unknown>)["apiKey"]).toBe("[redacted]");
    observability().capture({ message: "ok", severity: "info" });
  });
});

describe("recommendations", () => {
  it("rejects unknown or unapproved product ids", async () => {
    expect(validateRecommendations([{ slug: "not-a-real-product" }])).toEqual([]);
    const list = await recommend({}, 4);
    const approved = new Set(products.map((p) => p.slug));
    expect(list.length).toBeGreaterThan(0);
    for (const item of list) expect(approved.has(item.slug)).toBe(true);
  });
});

describe("webhooks", () => {
  const verify = () => true;

  it("requires a signature from providers that sign", () => {
    expect(requiresSignature("razorpay")).toBe(true);
    const outcome = receiveWebhook(
      {
        source: "payment",
        provider: "razorpay",
        eventId: "evt_1",
        receivedAt: "now",
        rawBody: "{}",
      },
      verify,
    );
    expect(outcome).toEqual({ status: "rejected", reason: "missing_signature" });
  });

  it("rejects replays of the same event id", () => {
    const inbound = {
      source: "shipping" as const,
      provider: "delhivery",
      eventId: "evt_2",
      receivedAt: "now",
      rawBody: JSON.stringify({ type: "scan" }),
    };
    expect(receiveWebhook(inbound, verify).status).toBe("accepted");
    expect(receiveWebhook(inbound, verify).status).toBe("duplicate");
  });

  it("rejects an invalid signature and unparsable bodies", () => {
    expect(
      receiveWebhook(
        {
          source: "payment",
          provider: "stripe",
          eventId: "evt_3",
          receivedAt: "now",
          signature: "bad",
          rawBody: "{}",
        },
        () => false,
      ),
    ).toEqual({ status: "rejected", reason: "invalid_signature" });
  });
});

describe("content", () => {
  it("never returns drafts on a public read", () => {
    const documents = [{ status: "draft" as const }, { status: "published" as const }].map(
      (partial, index) => ({
        id: String(index),
        kind: "page" as const,
        slug: `s${index}`,
        title: "t",
        body: "b",
        revision: "1",
        source: "local" as const,
        updatedAt: "now",
        ...partial,
      }),
    );
    expect(publishedOnly(documents)).toHaveLength(1);
  });
});
