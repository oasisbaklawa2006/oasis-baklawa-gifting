/**
 * Same approved feed as the XML endpoint, in the tab-delimited format some
 * Merchant Center / Pinterest scheduled fetches prefer.
 */

import { createFileRoute } from "@tanstack/react-router";

import { buildFeed, feedToTsv } from "@/lib/merchant-feed";

export const Route = createFileRoute("/feed/products.tsv")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const report = buildFeed(request.url);
        return new Response(feedToTsv(report), {
          headers: {
            "content-type": "text/tab-separated-values; charset=utf-8",
            "cache-control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
