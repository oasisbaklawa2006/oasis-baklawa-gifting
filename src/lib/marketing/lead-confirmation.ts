/**
 * A durable website lead is not proof that Oasis Central received an enquiry.
 * Only the signed operational handoff receipt produces a "synced" state.
 */
import type { LeadResult, LEAD_KINDS } from "@/lib/leads.functions";

type LeadKind = (typeof LEAD_KINDS)[number];
type SyncState = Extract<LeadResult, { status: "saved" }>["syncState"];

export type LeadConfirmation = {
  message: string;
  delivery: "confirmed" | "queued" | "unconfirmed" | "not-applicable";
};

export function leadConfirmation(
  kind: LeadKind,
  syncState: SyncState,
  successMessage: string,
): LeadConfirmation {
  // Newsletter and rewards are locally saved subscriptions/interest, not
  // operational enquiries. Their "synced" field is not a delivery receipt.
  if (!["contact", "corporate", "wedding", "partnership"].includes(kind)) {
    return { message: successMessage, delivery: "not-applicable" };
  }
  if (syncState === "synced") return { message: successMessage, delivery: "confirmed" };
  if (syncState === "failed") {
    return {
      message:
        "Your enquiry has been saved, but delivery to our team could not be confirmed. Please contact us directly if it is urgent.",
      delivery: "unconfirmed",
    };
  }
  return {
    message:
      "Your enquiry has been saved and is awaiting delivery to our team. Please contact us directly if it is urgent.",
    delivery: "queued",
  };
}
