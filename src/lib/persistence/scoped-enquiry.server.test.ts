import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

import { adapterStatus, getAdapter } from "@/adapters";
import { shippingAdapter } from "@/adapters/shipping";
import { paymentLaunchPolicy } from "@/payments/launch-policy";
import { Route as webhookRoute } from "@/routes/api/public/payments.webhook";

import { saveLead } from "../leads.server";
import { leadsRepository, persistenceHealth } from "./index.server";
import {
  SCOPED_ENQUIRY_PROVIDER,
  createScopedEnquiryLeadsRepository,
  readScopedEnquiryConfig,
} from "./scoped-enquiry.server";
import type { LeadDraft } from "./types";

const ENDPOINT = "https://abcdefghijklmnopqrst.supabase.co/functions/v1/gifting-enquiries";
const TOKEN = "synthetic-enquiry-token-0123456789-abcdef";
const SUBMISSION_ID = "196ffd60-f3e0-40ff-be07-c5cca531403b";
const SERVICE_ROLE_KEY = "synthetic-service-role-key-that-must-never-be-needed";

const ENV_KEYS = [
  "GIFTING_ENQUIRIES_ENDPOINT",
  "GIFTING_ENQUIRIES_TOKEN",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "PAYMENT_PROVIDER",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "RAZORPAY_WEBHOOK_SECRET",
  "STRIPE_PUBLISHABLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
] as const;
const saved: Record<string, string | undefined> = {};

const draft: LeadDraft = {
  kind: "contact",
  email: "enquiry@example.invalid",
  submissionId: SUBMISSION_ID,
  name: "Test Customer",
  message: "A synthetic enquiry.",
  source: "contact-page",
  consent: { marketing: false, timestamp: null },
  attribution: {},
};

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    queue: "gifting_enquiries",
    sourceLeadId: SUBMISSION_ID,
    enquiryId: "11111111-1111-4111-8111-111111111111",
    status: "accepted",
    ...overrides,
  };
}

function jsonResponse(body: unknown, status = 201, contentType = "application/json") {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": contentType },
  });
}

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

function configureOptionA() {
  process.env["GIFTING_ENQUIRIES_ENDPOINT"] = ENDPOINT;
  process.env["GIFTING_ENQUIRIES_TOKEN"] = TOKEN;
}

describe("Option A scoped enquiry persistence (no service-role key)", () => {
  it("persists an enquiry durably with the service-role key unset", async () => {
    configureOptionA();
    expect(process.env["SUPABASE_SERVICE_ROLE_KEY"]).toBeUndefined();
    expect(process.env["SUPABASE_URL"]).toBeUndefined();
    fetchMock.mockResolvedValueOnce(jsonResponse(receipt()));

    expect(leadsRepository().provider).toBe(SCOPED_ENQUIRY_PROVIDER);
    const outcome = await saveLead(draft);

    expect(outcome).toMatchObject({
      ok: true,
      deduped: false,
      record: { id: SUBMISSION_ID, kind: "contact", syncState: "synced" },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe(ENDPOINT);
    expect(init?.method).toBe("POST");
    const headers = init?.headers as Record<string, string>;
    expect(headers["authorization"]).toBe(`Bearer ${TOKEN}`);
    expect(headers["idempotency-key"]).toBe(SUBMISSION_ID);
    expect(JSON.stringify(init)).not.toContain(SERVICE_ROLE_KEY);
    expect(JSON.parse(String(init?.body))).toMatchObject({
      kind: "contact",
      email: "enquiry@example.invalid",
      source: "contact-page",
    });
  });

  it("lowercases the submission id so the receipt can match it", async () => {
    configureOptionA();
    fetchMock.mockResolvedValueOnce(jsonResponse(receipt()));
    const outcome = await saveLead({ ...draft, submissionId: SUBMISSION_ID.toUpperCase() });
    expect(outcome).toMatchObject({ ok: true, record: { id: SUBMISSION_ID } });
    const headers = fetchMock.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers["idempotency-key"]).toBe(SUBMISSION_ID);
  });

  it.each(["corporate", "wedding", "partnership"] as const)(
    "accepts the %s enquiry kind",
    async (kind) => {
      configureOptionA();
      fetchMock.mockResolvedValueOnce(jsonResponse(receipt()));
      await expect(saveLead({ ...draft, kind })).resolves.toMatchObject({ ok: true });
    },
  );

  it("reports no local queue, because Core's receipt is the only record", async () => {
    configureOptionA();
    const repository = leadsRepository();
    await expect(repository.counts()).resolves.toEqual({ pending_sync: 0, synced: 0, failed: 0 });
    await expect(repository.pendingSync()).resolves.toEqual([]);
    const health = await persistenceHealth();
    expect(health.provider).toBe(SCOPED_ENQUIRY_PROVIDER);
    expect(health.note).toContain("Gifting Enquiries queue");
  });

  it("leaves the database path in charge when its credentials exist", () => {
    configureOptionA();
    process.env["SUPABASE_URL"] = "https://abcdefghijklmnopqrst.supabase.co";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = SERVICE_ROLE_KEY;
    expect(leadsRepository().provider).toBe("database");
  });
});

describe("Option A fails closed", () => {
  it.each([
    ["no endpoint and no token", {}],
    ["endpoint without a token", { GIFTING_ENQUIRIES_ENDPOINT: ENDPOINT }],
    ["token without an endpoint", { GIFTING_ENQUIRIES_TOKEN: TOKEN }],
    [
      "whitespace-only settings",
      { GIFTING_ENQUIRIES_ENDPOINT: "   ", GIFTING_ENQUIRIES_TOKEN: "   " },
    ],
  ])("refuses to save with %s and never falls back to memory", async (_label, env) => {
    Object.assign(process.env, env);
    expect(readScopedEnquiryConfig()).toBeNull();
    expect(leadsRepository().durability).toBe("ephemeral");

    await expect(saveLead(draft)).resolves.toMatchObject({ ok: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an http endpoint", "http://abcdefghijklmnopqrst.supabase.co/functions/v1/gifting-enquiries"],
    ["an endpoint with credentials", "https://user:pw@abcdefghijklmnopqrst.supabase.co/x"],
    ["an endpoint with a query string", `${ENDPOINT}?debug=1`],
    ["an endpoint with a fragment", `${ENDPOINT}#frag`],
    ["a value that is not a URL", "not a url"],
  ])("refuses %s without sending anything", async (_label, endpoint) => {
    process.env["GIFTING_ENQUIRIES_ENDPOINT"] = endpoint;
    process.env["GIFTING_ENQUIRIES_TOKEN"] = TOKEN;
    const outcome = await saveLead(draft);
    expect(outcome).toMatchObject({ ok: false, reason: expect.stringContaining("misconfigured") });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["a receipt for a different enquiry", jsonResponse(receipt({ sourceLeadId: "other-id" }))],
    ["a receipt that is not accepted", jsonResponse(receipt({ status: "queued" }))],
    ["a receipt from another queue", jsonResponse(receipt({ queue: "other_queue" }))],
    ["a receipt with no enquiry id", jsonResponse(receipt({ enquiryId: "  " }))],
    ["a non-JSON content type", jsonResponse(receipt(), 201, "text/html")],
    ["an unparseable body", jsonResponse("{not json")],
    ["an empty JSON body", jsonResponse("null")],
    ["a 202 response", jsonResponse(receipt(), 202)],
    ["a 401 response", jsonResponse({ error: "unauthorized" }, 401)],
    ["a 422 response", jsonResponse({ error: "invalid_payload" }, 422)],
    ["a 500 response", jsonResponse({ error: "unavailable" }, 500)],
  ])("does not report success for %s", async (_label, response) => {
    configureOptionA();
    fetchMock.mockResolvedValueOnce(response);
    const outcome = await saveLead(draft);
    expect(outcome.ok).toBe(false);
    expect(JSON.stringify(outcome)).not.toContain(TOKEN);
  });

  it("does not report success when the request throws or times out", async () => {
    configureOptionA();
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    const outcome = await saveLead(draft);
    expect(outcome).toMatchObject({ ok: false, reason: "Gifting Enquiries request failed." });
    expect(JSON.stringify(outcome)).not.toContain("network down");
  });

  it.each(["newsletter", "rewards"] as const)(
    "does not store the %s sign-up without a database",
    async (kind) => {
      configureOptionA();
      const outcome = await saveLead({ ...draft, kind });
      expect(outcome.ok).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("requires a submission id for an enquiry", async () => {
    configureOptionA();
    const { submissionId: _omitted, ...withoutId } = draft;
    const outcome = await saveLead(withoutId);
    expect(outcome.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed if the send step does not confirm", async () => {
    const send = vi.fn().mockResolvedValue({ status: "skipped" });
    const repository = createScopedEnquiryLeadsRepository(
      () => ({ endpoint: ENDPOINT, token: TOKEN }),
      send,
    );
    await expect(repository.save(draft)).resolves.toMatchObject({ ok: false });
  });
});

describe("Option A leaves payments and shipping fail-closed", () => {
  it("keeps the payment launch policy off", () => {
    configureOptionA();
    expect(paymentLaunchPolicy.operational).toBe(false);
  });

  it("answers the payment webhook with 503 while no payment provider is configured", async () => {
    configureOptionA();
    const handlers = (
      webhookRoute as unknown as {
        options: {
          server: { handlers: Record<string, (c: { request: Request }) => Promise<Response>> };
        };
      }
    ).options.server.handlers;
    const response = await handlers["POST"]!({
      request: new Request("https://example.invalid/api/public/payments/webhook", {
        method: "POST",
        body: "{}",
      }),
    });
    expect(response.status).toBe(503);
  });

  it("keeps Shiprocket unconfigured and never claims serviceability", async () => {
    configureOptionA();
    expect(adapterStatus(getAdapter("shipping:shiprocket")!)).toBe("not-configured");
    const result = await shippingAdapter().checkServiceability({ postalCode: "110015" });
    expect(result.ok).toBe(false);
  });
});
