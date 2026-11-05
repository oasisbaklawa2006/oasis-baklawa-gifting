#!/usr/bin/env node
/**
 * Fail closed when a server secret is committed as an environment assignment.
 * Public Supabase project URLs and publishable keys may be versioned; service
 * credentials, provider secrets and passwords may not.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => /^\.env(?:\..+)?$/.test(path.basename(file)))
  .filter((file) => !/\.(?:example|sample|template)$/.test(file));

const forbidden = /(?:SERVICE_ROLE|SECRET|PRIVATE_KEY|PASSWORD|ACCESS_TOKEN|CLIENT_SECRET)/i;
const findings = [];
for (const file of tracked) {
  for (const [index, line] of readFileSync(file, "utf8").split(/\r?\n/).entries()) {
    const assignment = /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=/.exec(line);
    if (assignment && forbidden.test(assignment[1])) {
      findings.push(`${file}:${index + 1}: ${assignment[1]}`);
    }
  }
}
if (findings.length) {
  console.error("Do not commit private credentials in tracked environment files:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log("Tracked environment file check: no private credential assignments found.");
}
