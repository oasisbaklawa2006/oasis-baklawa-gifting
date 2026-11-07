import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

import { databaseStoreConfigured, leadStoreDurability } from "./lead-store";

const keys = [
  "APPVERSE_BASE_URL",
  "APPVERSE_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of keys) {
    const prior = original[key];
    if (prior === undefined) delete process.env[key];
    else process.env[key] = prior;
  }
});

describe("lead storage and operational sync truth", () => {
  it("never labels in-memory storage durable just because a Central adapter is configured", () => {
    process.env["APPVERSE_BASE_URL"] = "https://example.invalid";
    process.env["APPVERSE_API_KEY"] = "synthetic-only";
    process.env["SUPABASE_URL"] = "https://example.invalid";
    delete process.env["SUPABASE_SERVICE_ROLE_KEY"];

    expect(databaseStoreConfigured()).toBe(false);
    expect(leadStoreDurability()).toBe("ephemeral");
  });

  it("only reports the website database as durable when both server settings exist", () => {
    process.env["SUPABASE_URL"] = "https://example.invalid";
    process.env["SUPABASE_SERVICE_ROLE_KEY"] = "synthetic-only";

    expect(databaseStoreConfigured()).toBe(true);
    expect(leadStoreDurability()).toBe("durable");
  });

  it("does not let marketing delivery mark a lead as synced to Core", () => {
    const source = readFileSync(
      fileURLToPath(new URL("../lib/leads.functions.ts", import.meta.url)),
      "utf8",
    );
    const marketingStart = source.indexOf("// 2) Klaviyo profile");
    const stateWrite = source.indexOf("await markSync", marketingStart);
    expect(marketingStart).toBeGreaterThan(0);
    expect(stateWrite).toBeGreaterThan(marketingStart);
    const marketingSegment = source.slice(marketingStart, stateWrite);
    expect(marketingSegment).not.toMatch(/\bsyncState\s*=/);
  });
});
