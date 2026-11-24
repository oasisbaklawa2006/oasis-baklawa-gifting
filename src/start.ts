import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";

import { renderErrorPage } from "./lib/error-page";
import { resolveWixLegacyRedirect } from "./lib/redirects/wix-legacy-redirects";

// Permanent redirects for URLs from the retired Wix site. Runs before routing so legacy
// paths never reach the 404 page. Only GET/HEAD are redirected.
const legacyRedirectMiddleware = createMiddleware().server(async ({ request, next }) => {
  if (request.method === "GET" || request.method === "HEAD") {
    const target = resolveWixLegacyRedirect(new URL(request.url).pathname);
    if (target) throw redirect({ href: target, statusCode: 301 });
  }
  return next();
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [legacyRedirectMiddleware, errorMiddleware, csrfMiddleware],
}));
