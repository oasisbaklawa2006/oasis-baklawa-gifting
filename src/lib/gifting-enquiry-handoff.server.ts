import type { LeadRecord } from "./persistence/types";

type EnquiryHandoff =
  | { status: "skipped" }
  | { status: "synced" }
  | { status: "failed"; detail: string };

export async function sendGiftingEnquiry(
  record: LeadRecord,
  config: { endpoint?: string; token?: string },
): Promise<EnquiryHandoff> {
  if (!["contact", "corporate", "wedding", "partnership"].includes(record.kind)) {
    return { status: "skipped" };
  }
  if (record.syncState === "synced" || (!config.endpoint && !config.token)) {
    return { status: "skipped" };
  }

  const endpoint = URL.parse(config.endpoint ?? "");
  if (
    !endpoint ||
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    !config.token?.trim()
  ) {
    return { status: "failed", detail: "Gifting Enquiries endpoint is misconfigured." };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
        "idempotency-key": record.id,
      },
      body: JSON.stringify({
        kind: record.kind,
        email: record.email ?? null,
        phone: record.phone ?? null,
        name: record.name ?? null,
        company: record.company ?? null,
        message: record.message ?? null,
        source: record.source,
        consent: record.consent,
        attribution: record.attribution,
      }),
    });
    if (!response.ok) {
      return { status: "failed", detail: `Gifting Enquiries returned HTTP ${response.status}.` };
    }
    if (response.headers.get("content-type")?.split(";")[0]?.trim() === "application/json") {
      const receipt: unknown = await response.json().catch(() => null);
      if (
        receipt &&
        typeof receipt === "object" &&
        "queue" in receipt &&
        receipt.queue === "gifting_enquiries" &&
        "sourceLeadId" in receipt &&
        receipt.sourceLeadId === record.id &&
        "enquiryId" in receipt &&
        typeof receipt.enquiryId === "string" &&
        receipt.enquiryId.trim() &&
        "status" in receipt &&
        receipt.status === "accepted"
      ) {
        return { status: "synced" };
      }
    }
    return { status: "failed", detail: "Gifting Enquiries receipt was missing or invalid." };
  } catch {
    return { status: "failed", detail: "Gifting Enquiries request failed." };
  }
}
