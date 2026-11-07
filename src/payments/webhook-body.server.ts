/**
 * Read a signed webhook body without buffering unbounded client input.
 * The byte limit is enforced as stream chunks arrive, even when
 * Content-Length is absent or incorrect.
 */
export async function readBoundedWebhookBody(
  stream: ReadableStream<Uint8Array> | null,
  maxBytes: number,
): Promise<{ ok: true; body: string } | { ok: false }> {
  if (!stream) return { ok: true, body: "" };
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) return { ok: false };

  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return { ok: false };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, body: new TextDecoder("utf-8", { fatal: true }).decode(bytes) };
}
