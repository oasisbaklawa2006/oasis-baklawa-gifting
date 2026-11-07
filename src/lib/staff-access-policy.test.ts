import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";

import {
  requireVerifiedStaffStatusAccess,
  runVerifiedStaffStatusHandler,
} from "./staff-access-policy";

describe("Gifting staff status authorization", () => {
  it("denies access while the Oasis Core staff SSO bridge is unavailable", async () => {
    await expect(requireVerifiedStaffStatusAccess()).rejects.toThrow(
      /disabled pending verified Core SSO/,
    );
  });

  it("never calls a protected handler after rejecting the request", async () => {
    const handler = vi.fn(async () => ({ private: true }));
    await expect(runVerifiedStaffStatusHandler(handler)).rejects.toThrow(
      /disabled pending verified Core SSO/,
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it.each([
    ["adapters.functions.ts", "adapterStatusReport"],
    ["commerce.functions.ts", "integrationHealth"],
    ["marketing/status.functions.ts", "marketingStatus"],
    ["leads.functions.ts", "leadQueueStatus"],
  ])("requires server middleware on %s / %s", (file, functionName) => {
    const source = readFileSync(fileURLToPath(new URL(file, import.meta.url)), "utf8");
    const name = functionName.replace(/[.*+?^$()|[\]{}]/g, "\\$&");
    const guardedHandler = new RegExp(
      `export const ${name} = createServerFn[\\s\\S]*?\\.middleware\\(\\[staffStatusMiddleware\\]\\)\\s*\\.handler`,
    );
    expect(source).toMatch(guardedHandler);
  });
});
