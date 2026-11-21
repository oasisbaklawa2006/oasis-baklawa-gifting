import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

import { Route } from "../../src/routes/api/runtime-attestation";

const TOKEN = "test-runtime-attestation-token-0123456789";
const SERVICE_ROLE_KEY = "test-service-role-key-that-must-not-leak";
const PROJECT_REF = "abcdefghijklmnopqrst";
const GIT_SHA = "0123456789abcdef0123456789abcdef01234567";
const ENV_KEYS = [
  "TORCH_ATTEST_TOKEN",
  "GIT_SHA",
  "COMMIT_SHA",
  "VERCEL_GIT_COMMIT_SHA",
  "CF_PAGES_COMMIT_SHA",
  "GITHUB_SHA",
  "APP_ENVIRONMENT",
  "VERCEL_ENV",
  "NODE_ENV",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const route = Route as unknown as {
  options: {
    server: {
      handlers: Record<string, (context: { request: Request }) => Response | Promise<Response>>;
    };
  };
};
const handlers = route.options.server.handlers;
const repoRoot = fileURLToPath(new URL("../../", import.meta.url));
let savedEnv: Partial<Record<(typeof ENV_KEYS)[number], string>>;

function configureLiveEnvironment(): void {
  process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
  process.env["GIT_SHA"] = GIT_SHA;
  process.env["APP_ENVIRONMENT"] = "production";
  process.env["SUPABASE_URL"] = `https://${PROJECT_REF}.supabase.co`;
  process.env["SUPABASE_SERVICE_ROLE_KEY"] = SERVICE_ROLE_KEY;
}

async function request(method = "GET", token?: string): Promise<Response> {
  const headers = token ? { "X-Torch-Attest-Token": token } : undefined;
  return handlers[method]!({
    request: new Request("https://example.test/api/runtime-attestation", { method, headers }),
  });
}

async function expectNoMetadata(response: Response, status: number): Promise<void> {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  expect(response.body).toBeNull();
  expect(await response.text()).toBe("");
}

function findAttestationManifests(directory: string): string[] {
  let entries;
  try {
    entries = readdirSync(directory);
  } catch {
    return [];
  }

  return entries.flatMap((entry) => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return findAttestationManifests(path);
    if (!/\.(json|webmanifest)$/i.test(entry)) return [];

    const content = readFileSync(path, "utf8");
    return /attestation|torch.*(?:manifest|config)|runtime.*manifest/i.test(entry) ||
      (content.includes('"supabaseProjectRef"') && content.includes('"activeFeatureFlags"'))
      ? [path]
      : [];
  });
}

beforeEach(() => {
  savedEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  for (const key of ENV_KEYS) delete process.env[key];
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("GET /api/runtime-attestation", () => {
  it.each([undefined, "wrong-token"])("rejects a missing or invalid token (%s)", async (token) => {
    configureLiveEnvironment();
    await expectNoMetadata(await request("GET", token), 401);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"])(
    "rejects %s and sets the private no-store header",
    async (method) => {
      configureLiveEnvironment();
      const response = await request(method, TOKEN);
      expect(response.status).toBe(405);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.text()).toBe("");
    },
  );

  it("returns the exact six-key live contract without exposing credentials", async () => {
    configureLiveEnvironment();
    const response = await request("GET", TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");

    const text = await response.text();
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(
      [
        "activeFeatureFlags",
        "app",
        "demoMode",
        "environment",
        "gitSha",
        "supabaseProjectRef",
      ].sort(),
    );
    expect(body).toEqual({
      app: "gifting",
      gitSha: GIT_SHA,
      environment: "production",
      supabaseProjectRef: PROJECT_REF,
      activeFeatureFlags: { paymentLaunchOperational: false },
      demoMode: false,
    });
    expect(text).not.toContain(TOKEN);
    expect(text).not.toContain(SERVICE_ROLE_KEY);
  });

  it("supports bootable demo mode without Supabase credentials", async () => {
    process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
    process.env["GIT_SHA"] = GIT_SHA;
    process.env["APP_ENVIRONMENT"] = "development";

    const response = await request("GET", TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toMatchObject({
      supabaseProjectRef: null,
      demoMode: true,
    });
  });

  it.each([
    ["incomplete Supabase configuration", { SUPABASE_URL: "" }],
    ["malformed Supabase URL", { SUPABASE_URL: "https://not-a-supabase-project.example" }],
    ["invalid git SHA", { GIT_SHA: "not-a-commit" }],
    ["unknown environment", { APP_ENVIRONMENT: "test" }],
  ])("returns an empty 503 for %s with a valid token", async (_case, overrides) => {
    configureLiveEnvironment();
    for (const [key, value] of Object.entries(overrides)) {
      process.env[key] = value;
    }
    await expectNoMetadata(await request("GET", TOKEN), 503);
  });

  it("does not publish an attestation manifest in public or dist static assets", () => {
    const staticDirectories = [
      join(repoRoot, "public"),
      join(repoRoot, "dist"),
      join(repoRoot, ".output/public"),
    ];
    const manifests = staticDirectories.flatMap(findAttestationManifests);
    expect(manifests).toEqual([]);
  });
});
