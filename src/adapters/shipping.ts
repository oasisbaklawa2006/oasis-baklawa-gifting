/**
 * SHIPPING / LOGISTICS ADAPTER
 *
 * Appverse/Central remains the dispatch authority: it decides what ships, when
 * and with whom. This boundary only asks couriers questions and normalises
 * their answers onto the existing Oasis order lifecycle. Nothing here may
 * claim serviceability, a rate or a delivery date without a live response.
 */

import type { OrderStage } from "@/lib/order-status";

import { registerAdapter, recordError, recordSuccess, resolveAdapter } from "./registry";
import type { AdapterResult } from "./types";
import { notConfigured } from "./types";

export type ServiceabilityQuery = { postalCode: string; country?: string; codRequested?: boolean };

export type ServiceabilityResult = {
  serviceable: boolean;
  /** Only present when the courier returned one. Never estimated locally. */
  promisedWindow?: { earliest: string; latest: string };
  codAvailable?: boolean;
};

export type RateQuery = ServiceabilityQuery & { weightGrams: number; declaredValue?: number };

export type RateQuote = { service: string; amountMinor: number; currency: "INR"; etaDays?: number };

export type ShipmentRequest = {
  orderReference: string;
  /** Appverse-issued dispatch instruction id. The site never invents one. */
  dispatchId: string;
  postalCode: string;
  weightGrams: number;
};

export type Shipment = {
  shipmentId: string;
  awb?: string;
  labelUrl?: string;
  courier: string;
};

export type TrackingUpdate = {
  awb: string;
  rawStatus: string;
  stage: OrderStage;
  occurredAt: string;
  location?: string;
  proofOfDeliveryUrl?: string;
};

export interface ShippingAdapter {
  readonly provider: string;
  checkServiceability(query: ServiceabilityQuery): Promise<AdapterResult<ServiceabilityResult>>;
  quote(query: RateQuery): Promise<AdapterResult<RateQuote[]>>;
  createShipment(request: ShipmentRequest): Promise<AdapterResult<Shipment>>;
  schedulePickup(shipmentId: string, date: string): Promise<AdapterResult<{ scheduled: boolean }>>;
  track(awb: string): Promise<AdapterResult<TrackingUpdate[]>>;
  cancel(shipmentId: string): Promise<AdapterResult<{ cancelled: boolean }>>;
  normalizeWebhook(payload: unknown): TrackingUpdate | null;
}

/* ---------------- Courier status normalisation ---------------- */

const STATUS_MAP: Array<[RegExp, OrderStage]> = [
  [/pickup\s*scheduled|awaiting\s*pickup|manifest/i, "packed"],
  [/picked\s*up|in\s*transit|shipped|dispatch/i, "dispatched"],
  [/out\s*for\s*delivery|ofd/i, "out_for_delivery"],
  [/delivered|pod/i, "delivered"],
  [/rto|returned|undelivered|failed/i, "failed"],
  [/cancel/i, "cancelled"],
];

/** Maps any courier's free-text status onto the Oasis lifecycle, or null. */
export function normalizeCourierStatus(raw: string | null | undefined): OrderStage | null {
  if (!raw) return null;
  for (const [pattern, stage] of STATUS_MAP) if (pattern.test(raw)) return stage;
  return null;
}

/* ---------------- Manual / local-delivery fallback ---------------- */

const unavailable = <T>(detail: string): AdapterResult<T> => notConfigured<T>("manual", detail);

export const manualShipping: ShippingAdapter = {
  provider: "manual",
  async checkServiceability() {
    return unavailable(
      "No courier integration is configured, so serviceability cannot be confirmed here. Oasis confirms delivery after the order is placed.",
    );
  },
  async quote() {
    return unavailable("Shipping rates come from a courier account; none is configured.");
  },
  async createShipment() {
    return unavailable("Shipments are created by Oasis Central, not by the website.");
  },
  async schedulePickup() {
    return unavailable("Pickup scheduling requires a courier account.");
  },
  async track() {
    return unavailable("Tracking is read from Oasis Central once a courier is connected.");
  },
  async cancel() {
    return unavailable("Cancellation is handled by Oasis Central.");
  },
  normalizeWebhook: (payload) => normalizeShippingWebhook(payload),
};

export function normalizeShippingWebhook(payload: unknown): TrackingUpdate | null {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  const awb = record["awb"] ?? record["awb_code"] ?? record["waybill"];
  const rawStatus = record["status"] ?? record["current_status"] ?? record["ScanDetail"];
  if (typeof awb !== "string" || typeof rawStatus !== "string") return null;
  const stage = normalizeCourierStatus(rawStatus);
  if (!stage) return null;
  const occurredAt = record["timestamp"];
  const location = record["location"];
  const pod = record["pod_url"];
  return {
    awb,
    rawStatus,
    stage,
    occurredAt: typeof occurredAt === "string" ? occurredAt : new Date().toISOString(),
    ...(typeof location === "string" ? { location } : {}),
    ...(typeof pod === "string" ? { proofOfDeliveryUrl: pod } : {}),
  };
}

const boundary = (provider: string, label: string, env: readonly string[]): ShippingAdapter => ({
  ...manualShipping,
  provider,
  async checkServiceability() {
    return notConfigured(provider, `${label} is not configured. Required: ${env.join(", ")}.`);
  },
});

const boundaries: Record<string, ShippingAdapter> = {
  shiprocket: boundary("shiprocket", "Shiprocket", ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"]),
  delhivery: boundary("delhivery", "Delhivery", ["DELHIVERY_API_TOKEN", "DELHIVERY_CLIENT_NAME"]),
};

const CAPABILITIES = [
  "serviceability",
  "rate-quote",
  "promised-window",
  "shipment-create",
  "awb-label",
  "pickup",
  "tracking",
  "cancellation",
  "webhook-normalisation",
  "proof-of-delivery",
] as const;

registerAdapter({
  id: "shipping:manual",
  domain: "shipping",
  provider: "manual",
  label: "Manual / local delivery (Oasis Central dispatch)",
  capabilities: ["webhook-normalisation", "status-mapping"],
  requiredEnv: [],
  fallback: "Serviceability, rates and tracking are answered by Oasis Central, not by the site.",
  isFallback: true,
});

registerAdapter({
  id: "shipping:shiprocket",
  domain: "shipping",
  provider: "shiprocket",
  label: "Shiprocket",
  capabilities: CAPABILITIES,
  requiredEnv: ["SHIPROCKET_EMAIL", "SHIPROCKET_PASSWORD"],
  fallback: "Falls back to manual dispatch through Oasis Central.",
});

registerAdapter({
  id: "shipping:delhivery",
  domain: "shipping",
  provider: "delhivery",
  label: "Delhivery",
  capabilities: CAPABILITIES,
  requiredEnv: ["DELHIVERY_API_TOKEN", "DELHIVERY_CLIENT_NAME"],
  fallback: "Falls back to manual dispatch through Oasis Central.",
});

export function shippingAdapter(): ShippingAdapter {
  const descriptor = resolveAdapter("shipping");
  if (!descriptor || descriptor.provider === "manual") return manualShipping;
  return boundaries[descriptor.provider] ?? manualShipping;
}

export async function checkServiceability(
  query: ServiceabilityQuery,
): Promise<AdapterResult<ServiceabilityResult>> {
  const adapter = shippingAdapter();
  const result = await adapter.checkServiceability(query);
  if (result.ok) recordSuccess(`shipping:${adapter.provider}`);
  else recordError(`shipping:${adapter.provider}`, result.detail);
  return result;
}
