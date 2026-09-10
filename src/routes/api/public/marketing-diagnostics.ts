/**
 * Management diagnostics (JSON).
 *
 * Disabled unless ADMIN_DIAGNOSTICS_TOKEN is configured, and then only for a
 * caller presenting that token. Returns configuration state and counts only —
 * no credentials, customer data or commercial figures.
 */

import { createFileRoute } from "@tanstack/react-router";

import { marketingReadiness } from "@/config/marketing";
import { feedDiagnostics } from "@/lib/merchant-feed";

export const Route = createFileRoute("/api/public/marketing-diagnostics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const expected = (process.env["ADMIN_DIAGNOSTICS_TOKEN"] ?? "").trim();
        if (!expected) return new Response("Not found", { status: 404 });

        const presented = (
          request.headers.get("x-admin-token") ??
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          ""
        ).trim();
        if (presented !== expected) return new Response("Unauthorized", { status: 401 });

        const { leadCounts } = await import("@/lib/leads.server");
        return Response.json(
          {
            readiness: marketingReadiness(),
            feed: feedDiagnostics(request.url),
            leads: await leadCounts(),
            checkedAt: new Date().toISOString(),
          },
          { headers: { "cache-control": "no-store" } },
        );
      },
    },
  },
});
