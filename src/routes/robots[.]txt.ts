import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { buildRobotsTxt } from "@/lib/robots";
import { siteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) =>
        new Response(buildRobotsTxt(siteUrl("/sitemap.xml", request.url)), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
