/**
 * Marketing readiness for the private admin surface.
 * Reports configuration state and counts only — never a credential value.
 */

import { createServerFn } from "@tanstack/react-start";

import { marketingReadiness } from "@/config/marketing";
import { feedDiagnostics } from "@/lib/merchant-feed";

export const marketingStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { leadCounts } = await import("@/lib/leads.server");
  return {
    readiness: marketingReadiness(),
    feed: feedDiagnostics(),
    leads: leadCounts(),
    checkedAt: new Date().toISOString(),
  };
});
