import { describe, expect, it } from "vitest";

import { readBoundedWebhookBody } from "./webhook-body.server";

const streamFor = (body: string, chunkSize = 4) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      const bytes = new TextEncoder().encode(body);
      for (let index = 0; index < bytes.byteLength; index += chunkSize) {
        controller.enqueue(bytes.subarray(index, index + chunkSize));
      }
      controller.close();
    },
  });

describe("bounded payment webhook request body", () => {
  it("accepts the exact byte limit without altering the signed raw payload", async () => {
    const body = '{"ok":"🥮"}';
    const size = new TextEncoder().encode(body).byteLength;
    expect(await readBoundedWebhookBody(streamFor(body, 2), size)).toEqual({
      ok: true,
      body,
    });
  });

  it("rejects a body larger than the limit even without Content-Length", async () => {
    expect(await readBoundedWebhookBody(streamFor("123456789", 2), 8)).toEqual({
      ok: false,
    });
  });

  it("rejects large single chunks instead of buffering the complete body", async () => {
    expect(await readBoundedWebhookBody(streamFor("x".repeat(64), 64), 8)).toEqual({
      ok: false,
    });
  });

  it("accepts an empty stream but refuses an invalid limit", async () => {
    expect(await readBoundedWebhookBody(null, 8)).toEqual({ ok: true, body: "" });
    expect(await readBoundedWebhookBody(streamFor("abc"), 0)).toEqual({ ok: false });
  });
});
