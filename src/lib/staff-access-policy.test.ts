import { describe, expect, it } from "vitest";

import { requireVerifiedStaffStatusAccess } from "./staff-access-policy";

describe("Gifting staff status authorization", () => {
  it("denies access while the Oasis Core staff SSO bridge is unavailable", async () => {
    await expect(requireVerifiedStaffStatusAccess()).rejects.toThrow(
      /disabled pending verified Core SSO/,
    );
  });
});
