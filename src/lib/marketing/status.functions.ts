/**
 * Marketing readiness for the private admin surface.
 * Reports configuration state and counts only — never a credential value.
 */

import { createServerFn } from "@tanstack/react-start";

import { marketingReadiness } from "@/config/marketing";
import { feedDiagnostics } from "@/lib/merchant-feed";
import { staffStatusMiddleware } from "@/lib/staff-access-middleware";

export const marketingStatus = createServerFn({ method: "GET" })
  .middleware([staffStatusMiddleware])
  .handler(async () => {
    const { leadCounts } = await import("@/lib/leads.server");
    return {
      readiness: marketingReadiness(),
      feed: feedDiagnostics(),
      leads: await leadCounts(),
      checkedAt: new Date().toISOString(),
    };
  });
