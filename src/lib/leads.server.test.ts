import { beforeEach, describe, expect, it, vi } from "vitest";

import { saveLead } from "./leads.server";
import type { LeadDraft, LeadsRepository } from "./persistence/types";

const { repository, save } = vi.hoisted(() => ({
  repository: { durability: "ephemeral" as LeadsRepository["durability"] },
  save: vi.fn<LeadsRepository["save"]>(),
}));

vi.mock("./persistence/index.server", () => ({
  leadsRepository: () => ({ ...repository, save }),
}));

const draft: LeadDraft = {
  kind: "contact",
  email: "enquiry@example.invalid",
  submissionId: "196ffd60-f3e0-40ff-be07-c5cca531403b",
  source: "contact-page",
  consent: { marketing: false, timestamp: null },
  attribution: {},
};

describe("customer lead persistence", () => {
  beforeEach(() => {
    repository.durability = "ephemeral";
    save.mockReset();
  });

  it("rejects submissions before a memory write can be reported as saved", async () => {
    await expect(saveLead(draft)).resolves.toMatchObject({ ok: false });
    await expect(saveLead({ ...draft, kind: "newsletter" })).resolves.toMatchObject({ ok: false });
    expect(save).not.toHaveBeenCalled();
  });

  it("uses the durable repository and passes its outcome through", async () => {
    repository.durability = "durable";
    const saved = {
      ok: true,
      deduped: false,
      record: {
        ...draft,
        id: "cbbfb680-0700-48bf-bfe3-f462649b938f",
        key: "synthetic",
        syncState: "pending_sync",
        submissionCount: 1,
        createdAt: "2026-11-17T00:00:00Z",
        updatedAt: "2026-11-17T00:00:00Z",
      },
    } as const;
    save.mockResolvedValueOnce(saved).mockResolvedValueOnce({ ok: false, reason: "Write failed." });

    await expect(saveLead(draft)).resolves.toEqual(saved);
    await expect(saveLead(draft)).resolves.toEqual({ ok: false, reason: "Write failed." });
    expect(save).toHaveBeenCalledWith(draft);
  });
});
