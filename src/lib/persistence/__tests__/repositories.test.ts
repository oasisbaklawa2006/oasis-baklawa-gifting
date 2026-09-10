/**
 * Repository contract tests.
 *
 * They run against the in-memory implementation, which shares the exact port
 * the database repository implements: dedupe, idempotent retries, recovery
 * lifecycle, expiry, and the rule that a recovery session never carries price
 * or stock truth.
 */

import { describe, expect, it } from "vitest";

import {
  createMemoryLeadsRepository,
  createMemoryRecoveryRepository,
  dedupeKey,
} from "../memory-repositories";

const draft = {
  kind: "newsletter" as const,
  email: "Guest@Example.com",
  attribution: { last_utm_source: "newsletter" },
  consent: { marketing: true, timestamp: "2026-01-01T00:00:00.000Z" },
  source: "footer-newsletter",
};

describe("leads repository", () => {
  it("normalizes the dedupe key across casing and phone formatting", () => {
    expect(dedupeKey("newsletter", "Guest@Example.com")).toBe("newsletter:guest@example.com");
    expect(dedupeKey("contact", undefined, "+91 98 7654 3210")).toBe("contact:919876543210");
  });

  it("stores a lead once and reports a repeat submission as deduped", async () => {
    const repo = createMemoryLeadsRepository();
    const first = await repo.save(draft);
    const second = await repo.save({ ...draft, email: "guest@example.com" });

    expect(first.ok && first.deduped).toBe(false);
    expect(second.ok && second.deduped).toBe(true);
    expect(second.ok && second.record.id).toBe(first.ok ? first.record.id : "different");
  });

  it("keeps the original consent timestamp on a later submission", async () => {
    const repo = createMemoryLeadsRepository();
    await repo.save(draft);
    const again = await repo.save({
      ...draft,
      consent: { marketing: true, timestamp: "2026-06-01T00:00:00.000Z" },
    });
    expect(again.ok && again.record.consent.timestamp).toBe("2026-01-01T00:00:00.000Z");
  });

  it("refuses a lead with no contact detail", async () => {
    const repo = createMemoryLeadsRepository();
    const result = await repo.save({ ...draft, email: undefined as unknown as string });
    expect(result.ok).toBe(false);
  });

  it("treats Oasis Central handover as explicit, never assumed", async () => {
    const repo = createMemoryLeadsRepository();
    const saved = await repo.save(draft);
    expect(saved.ok && saved.record.syncState).toBe("pending_sync");
    expect((await repo.pendingSync()).length).toBe(1);

    await repo.markSync(dedupeKey("newsletter", draft.email), "synced");
    expect((await repo.counts()).synced).toBe(1);
    expect((await repo.pendingSync()).length).toBe(0);
  });
});

const lines = [{ productId: "p1", variantId: "v1", quantity: 2 }];
const future = new Date(Date.now() + 86_400_000).toISOString();

describe("cart recovery repository", () => {
  it("records one session per token and is idempotent on retry", async () => {
    const repo = createMemoryRecoveryRepository();
    const first = await repo.record({
      tokenHash: "hash-a",
      cartId: "cart_1",
      lines,
      expiresAt: future,
    });
    const retry = await repo.record({
      tokenHash: "hash-a",
      cartId: "cart_1",
      lines,
      expiresAt: future,
    });

    expect(first.ok && first.deduped).toBe(false);
    expect(retry.ok && retry.deduped).toBe(true);
    expect((await repo.counts()).active).toBe(1);
  });

  it("stores only product intent — never price or stock truth", async () => {
    const repo = createMemoryRecoveryRepository();
    const saved = await repo.record({
      tokenHash: "hash-b",
      cartId: "cart_2",
      lines,
      expiresAt: future,
    });
    const keys = saved.ok ? Object.keys(saved.session.lines[0]!) : [];
    expect(keys.sort()).toEqual(["productId", "quantity", "variantId"]);
  });

  it("claims an active session and counts the redemption", async () => {
    const repo = createMemoryRecoveryRepository();
    await repo.record({ tokenHash: "hash-c", cartId: "cart_3", lines, expiresAt: future });
    const claim = await repo.claim("hash-c");
    expect(claim.ok && claim.session.redeemCount).toBe(1);
  });

  it("rejects an unknown and an expired link", async () => {
    const repo = createMemoryRecoveryRepository();
    const unknown = await repo.claim("nope");
    expect(unknown.ok).toBe(false);
    expect(!unknown.ok && unknown.reason).toBe("unknown");

    const past = new Date(Date.now() - 1000).toISOString();
    await repo.record({ tokenHash: "hash-d", cartId: "cart_4", lines, expiresAt: past });
    const expired = await repo.claim("hash-d");
    expect(!expired.ok && expired.reason).toBe("expired");
    expect((await repo.counts()).expired).toBe(1);
  });

  it("expires due sessions during housekeeping", async () => {
    const repo = createMemoryRecoveryRepository();
    await repo.record({
      tokenHash: "hash-e",
      cartId: "cart_5",
      lines,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await repo.expireDue()).toBe(1);
  });
});
