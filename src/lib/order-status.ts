/**
 * ORDER LIFECYCLE MODEL (web-facing)
 *
 * One typed customer-safe order lifecycle. Operational truth lives in Oasis
 * Central / Appverse; this module only *maps* whatever raw status the
 * connector returns into a deterministic, presentable stage. The browser may
 * never mutate an order stage — it only renders one.
 */

export type OrderStage =
  | "draft"
  | "awaiting_payment"
  | "payment_authorized"
  | "confirmed"
  | "processing"
  | "quality_check"
  | "packed"
  | "dispatched"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "refund_pending"
  | "refunded"
  | "failed";

export type StageTone = "neutral" | "progress" | "success" | "warning";

export type StageMeta = {
  stage: OrderStage;
  /** Deterministic position on the happy-path timeline; -1 for off-path states. */
  order: number;
  label: string;
  description: string;
  tone: StageTone;
  /** Off-path states (cancelled, refunded, failed) are not timeline steps. */
  onTimeline: boolean;
  terminal: boolean;
};

export const ORDER_STAGES: Record<OrderStage, StageMeta> = {
  draft: {
    stage: "draft",
    order: 0,
    label: "Order started",
    description: "Your details are saved and the order is ready to be confirmed.",
    tone: "neutral",
    onTimeline: true,
    terminal: false,
  },
  awaiting_payment: {
    stage: "awaiting_payment",
    order: 1,
    label: "Awaiting payment",
    description: "We are waiting for your payment to complete.",
    tone: "warning",
    onTimeline: true,
    terminal: false,
  },
  payment_authorized: {
    stage: "payment_authorized",
    order: 2,
    label: "Payment received",
    description: "Your payment has been authorised.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  confirmed: {
    stage: "confirmed",
    order: 3,
    label: "Order confirmed",
    description: "Your order is confirmed and queued with our kitchen.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  processing: {
    stage: "processing",
    order: 4,
    label: "Being prepared",
    description: "Your sweets are being prepared in small batches.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  quality_check: {
    stage: "quality_check",
    order: 5,
    label: "Final checks",
    description: "Every box is checked before it is wrapped.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  packed: {
    stage: "packed",
    order: 6,
    label: "Packed",
    description: "Your order is wrapped, sealed and ready for collection by the courier.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  dispatched: {
    stage: "dispatched",
    order: 7,
    label: "Dispatched",
    description: "Your parcel has left us and is with the courier.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  out_for_delivery: {
    stage: "out_for_delivery",
    order: 8,
    label: "Out for delivery",
    description: "Your parcel is with the delivery rider today.",
    tone: "progress",
    onTimeline: true,
    terminal: false,
  },
  delivered: {
    stage: "delivered",
    order: 9,
    label: "Delivered",
    description: "Your order has been delivered.",
    tone: "success",
    onTimeline: true,
    terminal: true,
  },
  cancelled: {
    stage: "cancelled",
    order: -1,
    label: "Cancelled",
    description: "This order was cancelled.",
    tone: "warning",
    onTimeline: false,
    terminal: true,
  },
  refund_pending: {
    stage: "refund_pending",
    order: -1,
    label: "Refund in progress",
    description: "A refund has been raised and is being processed by your bank.",
    tone: "warning",
    onTimeline: false,
    terminal: false,
  },
  refunded: {
    stage: "refunded",
    order: -1,
    label: "Refunded",
    description: "This order has been refunded.",
    tone: "neutral",
    onTimeline: false,
    terminal: true,
  },
  failed: {
    stage: "failed",
    order: -1,
    label: "Needs attention",
    description: "Something went wrong with this order. Our team can help.",
    tone: "warning",
    onTimeline: false,
    terminal: true,
  },
};

/** Happy-path timeline, in display order. */
export const TIMELINE_STAGES: StageMeta[] = Object.values(ORDER_STAGES)
  .filter((meta) => meta.onTimeline && meta.stage !== "draft" && meta.stage !== "awaiting_payment")
  .sort((a, b) => a.order - b.order);

/**
 * Raw connector/provider vocabulary → customer-safe stage.
 * Internal factory jargon is deliberately collapsed into plain stages.
 */
const RAW_MAP: Record<string, OrderStage> = {
  draft: "draft",
  created: "draft",
  intent: "draft",
  pending_payment: "awaiting_payment",
  awaiting_payment: "awaiting_payment",
  payment_pending: "awaiting_payment",
  unpaid: "awaiting_payment",
  authorized: "payment_authorized",
  authorised: "payment_authorized",
  paid: "payment_authorized",
  captured: "payment_authorized",
  payment_captured: "payment_authorized",
  confirmed: "confirmed",
  accepted: "confirmed",
  in_production: "processing",
  production: "processing",
  processing: "processing",
  under_preparation: "processing",
  kitchen: "processing",
  wip: "processing",
  qc: "quality_check",
  quality_check: "quality_check",
  ready: "quality_check",
  packed: "packed",
  packing: "packed",
  ready_to_ship: "packed",
  dispatched: "dispatched",
  shipped: "dispatched",
  in_transit: "dispatched",
  manifested: "dispatched",
  out_for_delivery: "out_for_delivery",
  ofd: "out_for_delivery",
  delivered: "delivered",
  completed: "delivered",
  cancelled: "cancelled",
  canceled: "cancelled",
  rto: "failed",
  returned: "failed",
  exception: "failed",
  failed: "failed",
  refund_initiated: "refund_pending",
  refund_pending: "refund_pending",
  refunded: "refunded",
};

/** Normalize any raw status string. Unknown values fail safe to `confirmed`? No — to `failed` is wrong too: use `processing` only for known words. */
export function mapOrderStage(raw: string | null | undefined): OrderStage | null {
  if (!raw) return null;
  const key = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return RAW_MAP[key] ?? null;
}

export function stageMeta(stage: OrderStage): StageMeta {
  return ORDER_STAGES[stage];
}

/** Timeline steps with completion flags relative to the current stage. */
export function timelineFor(
  stage: OrderStage,
): { meta: StageMeta; complete: boolean; current: boolean }[] {
  const current = ORDER_STAGES[stage];
  return TIMELINE_STAGES.map((meta) => ({
    meta,
    complete: current.order >= meta.order && current.order >= 0,
    current: meta.stage === stage,
  }));
}

/** Cancellation may only be *requested* before the parcel is packed. */
export function canRequestCancellation(stage: OrderStage): boolean {
  const meta = ORDER_STAGES[stage];
  return meta.onTimeline && meta.order >= 0 && meta.order < ORDER_STAGES.packed.order;
}

export function isExceptionStage(stage: OrderStage): boolean {
  return stage === "failed" || stage === "cancelled";
}
