#!/usr/bin/env node
/**
 * Prevent silent removal of the minimum launch-critical regression suites.
 * This is a coverage-inventory guard, not a substitute for line/branch coverage
 * or production integration/UAT tests.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const required = new Map([
  ["src/commerce/quote-policy.test.ts", 4],
  ["src/payments/launch-policy.test.ts", 3],
  ["src/payments/webhook-body.test.ts", 4],
  ["src/lib/__tests__/payment-signatures.test.ts", 7],
  ["src/lib/__tests__/commerce.test.ts", 4],
  ["src/lib/persistence/__tests__/repositories.test.ts", 10],
  ["src/lib/__tests__/marketing.test.ts", 11],
]);

const failures = [];
let total = 0;
for (const [file, minimum] of required) {
  if (!existsSync(file)) {
    failures.push(`Required test suite missing: ${file}`);
    continue;
  }
  const source = readFileSync(file, "utf8");
  const count = [...source.matchAll(/\b(?:it|test)\s*\(\s*["'`]/g)].length;
  total += count;
  if (count < minimum) {
    failures.push(`${file}: ${count} tests, expected at least ${minimum}`);
  }
}
if (failures.length) {
  for (const failure of failures) console.error(failure);
  process.exitCode = 1;
} else {
  console.log(
    `Critical regression inventory: ${total} tests across ${required.size} required suites.`,
  );
}
