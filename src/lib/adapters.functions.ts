/**
 * Adapter registry status for the private admin surface.
 * Reports capability, configuration state and required key NAMES — never a
 * credential value, customer record or commercial figure.
 */

import { createServerFn } from "@tanstack/react-start";

import { adapterReport } from "@/adapters";

export const adapterStatusReport = createServerFn({ method: "GET" }).handler(async () => {
  const { persistenceHealth } = await import("@/lib/persistence/index.server");
  const adapters = adapterReport().map(({ testConnection: _testConnection, ...rest }) => rest);
  const persistence = await persistenceHealth();

  return {
    adapters,
    leadStore: {
      provider: persistence.provider,
      durability: persistence.durability,
      note: persistence.note,
      leads: persistence.leads,
      recovery: persistence.recovery,
    },
    checkedAt: new Date().toISOString(),
  };
});
