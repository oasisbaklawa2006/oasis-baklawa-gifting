import { afterEach, describe, expect, it, vi } from "vitest";

import { sendGiftingEnquiry } from "./gifting-enquiry-handoff.server";
import type { LeadRecord } from "./persistence/types";

const lead: LeadRecord = {
  id: "196ffd60-f3e0-40ff-be07-c5cca531403b",
  kind: "contact",
  key: "synthetic",
  email: "enquiry@example.invalid",
  source: "contact-page",
  consent: { marketing: false, timestamp: null },
  attribution: {},
  submissionCount: 1,
  createdAt: "2026-11-17T00:00:00Z",
  updatedAt: "2026-11-17T00:00:00Z",
  syncState: "pending_sync",
};

const config = {
  endpoint: "https://crm.example.invalid/v1/gifting-enquiries",
  token: "test-token",
};
const receipt = {
  status: "accepted",
  queue: "gifting_enquiries",
  sourceLeadId: lead.id,
  enquiryId: "crm-enquiry-1",
};

afterEach(() => vi.unstubAllGlobals());

describe("Gifting Enquiries handoff", () => {
  it("requires a matching receipt and keeps the same idempotency key on retries", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => Response.json(receipt));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendGiftingEnquiry(lead, config)).resolves.toEqual({ status: "synced" });
    await expect(sendGiftingEnquiry(lead, config)).resolves.toEqual({ status: "synced" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    for (const [url, request] of fetchMock.mock.calls) {
      expect(String(url)).toBe(config.endpoint);
      expect(request?.redirect).toBe("error");
      expect(new Headers(request?.headers).get("idempotency-key")).toBe(lead.id);
      expect(new Headers(request?.headers).get("authorization")).toBe("Bearer test-token");
    }
  });

  it.each([
    ["an HTML fallback", () => new Response("<html/>", { headers: { "content-type": "text/html" } })],
    ["an empty 204", () => new Response(null, { status: 204 })],
    ["a different source ID", () => Response.json({ ...receipt, sourceLeadId: "another-lead" })],
    ["a different queue", () => Response.json({ ...receipt, queue: "another-queue" })],
    ["a rejection", () => Response.json(receipt, { status: 403 })],
  ])("does not record sync on %s", async (_name, response) => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(async () => response()));
    await expect(sendGiftingEnquiry(lead, config)).resolves.toMatchObject({ status: "failed" });
  });

  it("keeps subscriptions and completed or unconfigured enquiries out of the request path", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendGiftingEnquiry({ ...lead, kind: "newsletter" }, config)).resolves.toEqual({
      status: "skipped",
    });
    await expect(sendGiftingEnquiry({ ...lead, syncState: "synced" }, config)).resolves.toEqual({
      status: "skipped",
    });
    await expect(sendGiftingEnquiry(lead, {})).resolves.toEqual({ status: "skipped" });
    await expect(
      sendGiftingEnquiry(lead, { ...config, endpoint: "http://crm.example.invalid/v1/leads" }),
    ).resolves.toMatchObject({ status: "failed" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
