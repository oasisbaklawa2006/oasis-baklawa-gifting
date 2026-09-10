/**
 * ADAPTER LAYER ENTRY POINT
 *
 * Importing this module registers every adapter domain exactly once. Oasis
 * Central / Appverse stays the operational authority; everything registered
 * here is a replaceable orchestration boundary with a working fallback.
 */

import "./communications";
import "./push";
import "./shipping";
import "./address";
import "./search";
import "./recommendations";
import "./reviews";
import "./loyalty";
import "./crm";
import "./lead-store";
import "./support";
import "./tax";
import "./channels";
import "./referral";
import "./experiments";
import "./identity";
import "./observability";
import "./media";
import "./content";
import "./webhooks";

export * from "./types";
export {
  adapterHealth,
  adapterReport,
  adapterStatus,
  getAdapter,
  listAdapters,
  registerAdapter,
  recordError,
  recordSuccess,
  resetAdapterHealth,
  resolveAdapter,
  selectedProviderName,
} from "./registry";
