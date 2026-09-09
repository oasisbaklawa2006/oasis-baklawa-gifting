import { describe, expect, it } from "vitest";

import {
  canRequestCancellation,
  mapOrderStage,
  stageMeta,
  timelineFor,
} from "@/lib/order-status";

describe("order stage mapping", () => {
  it("maps provider vocabulary onto customer-safe stages", () => {
    expect(mapOrderStage("IN_TRANSIT")).toBe("dispatched");
    expect(mapOrderStage("out for delivery")).toBe("out_for_delivery");
    expect(mapOrderStage("payment captured")).toBe("payment_authorized");
    expect(mapOrderStage("under-preparation")).toBe("processing");
    expect(mapOrderStage("RTO")).toBe("failed");
  });

  it("returns null for unknown or empty statuses rather than guessing", () => {
    expect(mapOrderStage("")).toBeNull();
    expect(mapOrderStage(undefined)).toBeNull();
    expect(mapOrderStage("banana")).toBeNull();
  });

  it("marks completed steps deterministically", () => {
    const timeline = timelineFor("packed");
    const packed = timeline.find((step) => step.meta.stage === "packed");
    const dispatched = timeline.find((step) => step.meta.stage === "dispatched");
    expect(packed?.complete).toBe(true);
    expect(packed?.current).toBe(true);
    expect(dispatched?.complete).toBe(false);
  });

  it("keeps off-path states off the timeline", () => {
    expect(timelineFor("cancelled").every((step) => !step.complete)).toBe(true);
    expect(stageMeta("refunded").onTimeline).toBe(false);
  });

  it("allows cancellation requests only before packing", () => {
    expect(canRequestCancellation("confirmed")).toBe(true);
    expect(canRequestCancellation("processing")).toBe(true);
    expect(canRequestCancellation("packed")).toBe(false);
    expect(canRequestCancellation("delivered")).toBe(false);
    expect(canRequestCancellation("cancelled")).toBe(false);
  });
});
