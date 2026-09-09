/**
 * Commerce provider resolution. The rest of the app imports only `commerce`.
 */

import { commerceProvider } from "@/config/integrations";

import { nativeProvider } from "./native-adapter";
import { shopifyProvider } from "./shopify-adapter";
import type { CommerceProvider } from "./types";

const registry: Record<string, CommerceProvider> = {
  native: nativeProvider,
  shopify: shopifyProvider,
};

export const commerce: CommerceProvider = registry[commerceProvider] ?? nativeProvider;

export * from "./types";
