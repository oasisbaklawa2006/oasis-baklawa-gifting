import { describe, expect, it } from "vitest";

import { leadConfirmation } from "./lead-confirmation";

const deliveredMessage = "Thank you — your enquiry is with our team.";

describe("honest durable lead confirmations", () => {
  it.each(["contact", "corporate", "wedding", "partnership"] as const)(
    "does not claim operational delivery for queued %s enquiries",
    (kind) => {
      const receipt = leadConfirmation(kind, "pending_sync", deliveredMessage);
      expect(receipt.delivery).toBe("queued");
      expect(receipt.message).toContain("saved");
      expect(receipt.message).toContain("awaiting delivery");
      expect(receipt.message).not.toBe(deliveredMessage);
    },
  );

  it("distinguishes delivery failure from persistence failure", () => {
    const receipt = leadConfirmation("contact", "failed", deliveredMessage);
    expect(receipt).toMatchObject({
      delivery: "unconfirmed",
      message: expect.stringContaining("delivery to our team could not be confirmed"),
    });
    expect(receipt.message).toContain("saved");
  });

  it("uses the page's success copy only after operational receipt confirmation", () => {
    expect(leadConfirmation("contact", "synced", deliveredMessage)).toEqual({
      message: deliveredMessage,
      delivery: "confirmed",
    });
  });

  it.each(["newsletter", "rewards"] as const)(
    "does not mistake %s subscription persistence for operational CRM delivery",
    (kind) => {
      for (const state of ["pending_sync", "synced", "failed"] as const) {
        expect(leadConfirmation(kind, state, "Your interest was saved.")).toEqual({
          message: "Your interest was saved.",
          delivery: "not-applicable",
        });
      }
    },
  );
});
