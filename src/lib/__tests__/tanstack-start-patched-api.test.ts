import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The patched TanStack Start release removes inputValidator().
// All externally callable server functions must retain their declared validators.
const serverFunctionPaths = [
  "src/lib/cart-recovery.functions.ts",
  "src/lib/catalog/catalog.functions.ts",
  "src/lib/catalogue/core-public.functions.ts",
  "src/lib/commerce.functions.ts",
  "src/lib/leads.functions.ts",
  "src/lib/marketing/marketing.functions.ts",
  "src/lib/payments.functions.ts",
  "src/lib/support.functions.ts",
];

describe("TanStack Start patched API compatibility", () => {
  for (const file of serverFunctionPaths) {
    it(`preserves validation on every server function in ${file}`, () => {
      const source = readFileSync(resolve(process.cwd(), file), "utf8");
      expect(source).not.toContain(".inputValidator(");
      expect(source).toContain(".validator(");
    });
  }

  it("handles non-Error throws in the root error boundary", () => {
    const source = readFileSync(resolve(process.cwd(), "src/routes/__root.tsx"), "utf8");
    expect(source).toContain("error: unknown");
    expect(source).toContain("error instanceof Error ? error : new Error(String(error))");
  });
});
