/**
 * Google Merchant Center / Pinterest catalogue feed (XML).
 * Only approved, complete catalogue records are published — see merchant-feed.ts.
 */

import { createFileRoute } from "@tanstack/react-router";

import { buildFeed, feedToXml } from "@/lib/merchant-feed";

export const Route = createFileRoute("/feed/products.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const report = buildFeed(request.url);
        return new Response(feedToXml(report, request.url), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
            "cache-control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
