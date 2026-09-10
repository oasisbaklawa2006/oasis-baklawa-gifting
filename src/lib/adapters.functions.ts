/**
 * Adapter registry status for the private admin surface.
 * Reports capability, configuration state and required key NAMES — never a
 * credential value, customer record or commercial figure.
 */

import { createServerFn } from "@tanstack/react-start";

import { adapterReport } from "@/adapters";
import { leadStoreDurability } from "@/adapters/lead-store";

export const adapterStatusReport = createServerFn({ method: "GET" }).handler(async () => {
  const adapters = adapterReport().map(({ testConnection: _testConnection, ...rest }) => rest);
  return {
    adapters,
    leadStore: {
      durability: leadStoreDurability(),
      note:
        leadStoreDurability() === "durable"
          ? "Queued leads survive restarts."
          : "Queued leads and cart-recovery records live in server memory and are LOST on restart or deploy. Not production-safe on its own.",
    },
    checkedAt: new Date().toISOString(),
  };
});
