/**
 * Torch Bearer runtime attestation (JSON, GET only).
 *
 * Requires X-Torch-Attest-Token. Missing/wrong token -> 401, unbootable server
 * config -> 503; neither returns any metadata. Never cached.
 */

import { createFileRoute } from "@tanstack/react-router";

const HEADERS = { "Cache-Control": "private, no-store" } as const;

const notAllowed = () => new Response(null, { status: 405, headers: { ...HEADERS, Allow: "GET" } });

export const Route = createFileRoute("/api/runtime-attestation")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const { buildRuntimeAttestation } = await import("@/lib/torch/runtime-config.server");
          const result = buildRuntimeAttestation(request.headers.get("x-torch-attest-token"));
          return result.body
            ? Response.json(result.body, { status: 200, headers: HEADERS })
            : new Response(null, { status: result.status, headers: HEADERS });
        } catch {
          return new Response(null, { status: 503, headers: HEADERS });
        }
      },
      POST: notAllowed,
      PUT: notAllowed,
      PATCH: notAllowed,
      DELETE: notAllowed,
      HEAD: notAllowed,
      OPTIONS: notAllowed,
    },
  },
});
