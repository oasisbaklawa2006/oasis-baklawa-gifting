import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => ({ options }),
}));

import { readSupabaseServerConfig } from "../../src/integrations/supabase/client.server";
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
  "GIFTING_ENQUIRIES_ENDPOINT",
  "GIFTING_ENQUIRIES_TOKEN",
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
    const subdirectory = findAttestationManifests(path);
    if (subdirectory.length > 0) return subdirectory;
    if (!/\.(json|webmanifest)$/i.test(entry)) return [];

    let content: string;
    try {
      content = readFileSync(path, "utf8");
    } catch {
      return [];
    }
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

  it.each(["preview", "development"])(
    "supports bootable demo mode in %s without Supabase credentials",
    async (environment) => {
      process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
      process.env["GIT_SHA"] = GIT_SHA;
      process.env["APP_ENVIRONMENT"] = environment;

      const response = await request("GET", TOKEN);
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("private, no-store");
      expect(await response.json()).toEqual({
        app: "gifting",
        gitSha: GIT_SHA,
        environment,
        supabaseProjectRef: null,
        activeFeatureFlags: { paymentLaunchOperational: false },
        demoMode: true,
      });
    },
  );

  it("returns an empty 503 in production when Supabase config is missing", async () => {
    process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
    process.env["GIT_SHA"] = GIT_SHA;
    process.env["APP_ENVIRONMENT"] = "production";
    await expectNoMetadata(await request("GET", TOKEN), 503);
  });

  it("still returns 401 (not 503) without a valid token when production config is missing", async () => {
    process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
    process.env["GIT_SHA"] = GIT_SHA;
    process.env["APP_ENVIRONMENT"] = "production";
    await expectNoMetadata(await request("GET"), 401);
  });

  describe("production with scoped enquiry persistence and no service-role key", () => {
    const SCOPED_ENDPOINT = `https://${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries`;
    const SCOPED_TOKEN = "scoped-enquiry-token-0123456789-abcdefghij";

    function configureScopedProduction(): void {
      process.env["TORCH_ATTEST_TOKEN"] = TOKEN;
      process.env["GIT_SHA"] = GIT_SHA;
      process.env["APP_ENVIRONMENT"] = "production";
      process.env["GIFTING_ENQUIRIES_ENDPOINT"] = SCOPED_ENDPOINT;
      process.env["GIFTING_ENQUIRIES_TOKEN"] = SCOPED_TOKEN;
    }

    it("attests the Core project from the endpoint without any database credential", async () => {
      configureScopedProduction();
      expect(process.env["SUPABASE_URL"]).toBeUndefined();
      expect(process.env["SUPABASE_SERVICE_ROLE_KEY"]).toBeUndefined();
      const response = await request("GET", TOKEN);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(JSON.parse(text)).toEqual({
        app: "gifting",
        gitSha: GIT_SHA,
        environment: "production",
        supabaseProjectRef: PROJECT_REF,
        activeFeatureFlags: { paymentLaunchOperational: false },
        demoMode: false,
      });
      expect(text).not.toContain(SCOPED_TOKEN);
      expect(text).not.toContain(SCOPED_ENDPOINT);
    });

    it.each([
      ["a token shorter than the receiver requires", { GIFTING_ENQUIRIES_TOKEN: "too-short" }],
      ["a missing token", { GIFTING_ENQUIRIES_TOKEN: "" }],
      ["a missing endpoint", { GIFTING_ENQUIRIES_ENDPOINT: "" }],
      [
        "an http endpoint",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `http://${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries`,
        },
      ],
      [
        "an endpoint with credentials",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `https://u:p@${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries`,
        },
      ],
      [
        "an endpoint with a port",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `https://${PROJECT_REF}.supabase.co:8443/functions/v1/gifting-enquiries`,
        },
      ],
      [
        "an endpoint with a query string",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `https://${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries?x=1`,
        },
      ],
      [
        "an endpoint with a fragment",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `https://${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries#x`,
        },
      ],
      [
        "a different function path",
        { GIFTING_ENQUIRIES_ENDPOINT: `https://${PROJECT_REF}.supabase.co/functions/v1/other` },
      ],
      [
        "a host that is not a Supabase project",
        { GIFTING_ENQUIRIES_ENDPOINT: "https://example.com/functions/v1/gifting-enquiries" },
      ],
      [
        "a nested subdomain",
        {
          GIFTING_ENQUIRIES_ENDPOINT: `https://x.${PROJECT_REF}.supabase.co/functions/v1/gifting-enquiries`,
        },
      ],
      [
        "a project ref of the wrong length",
        { GIFTING_ENQUIRIES_ENDPOINT: "https://short.supabase.co/functions/v1/gifting-enquiries" },
      ],
    ])("stays unbootable (503) with %s", async (_label, override) => {
      configureScopedProduction();
      Object.assign(process.env, override);
      await expectNoMetadata(await request("GET", TOKEN), 503);
    });

    it("does not let a half-configured legacy database block the scoped endpoint", async () => {
      configureScopedProduction();
      process.env["SUPABASE_URL"] = `https://${PROJECT_REF}.supabase.co`;
      const response = await request("GET", TOKEN);
      expect(response.status).toBe(200);
      expect((await response.json()).supabaseProjectRef).toBe(PROJECT_REF);
    });

    it("attests the scoped endpoint project even when legacy database credentials are present", async () => {
      configureScopedProduction();
      const DB_REF = "zzzzzzzzzzzzzzzzzzzz";
      process.env["SUPABASE_URL"] = `https://${DB_REF}.supabase.co`;
      process.env["SUPABASE_SERVICE_ROLE_KEY"] = SERVICE_ROLE_KEY;
      const body = await (await request("GET", TOKEN)).json();
      expect(body.supabaseProjectRef).toBe(PROJECT_REF);
      expect(body.supabaseProjectRef).not.toBe(DB_REF);
    });

    it("stays unbootable instead of falling back to the database when the scoped pair is incomplete", async () => {
      configureScopedProduction();
      delete process.env["GIFTING_ENQUIRIES_TOKEN"];
      process.env["SUPABASE_URL"] = `https://${PROJECT_REF}.supabase.co`;
      process.env["SUPABASE_SERVICE_ROLE_KEY"] = SERVICE_ROLE_KEY;
      await expectNoMetadata(await request("GET", TOKEN), 503);
    });

    it("still requires the attestation token", async () => {
      configureScopedProduction();
      await expectNoMetadata(await request("GET"), 401);
    });
  });

  it("returns the exact six-key live contract in preview", async () => {
    configureLiveEnvironment();
    process.env["APP_ENVIRONMENT"] = "preview";
    const response = await request("GET", TOKEN);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    const body = (await response.json()) as Record<string, unknown>;
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
    expect(body).toMatchObject({
      environment: "preview",
      supabaseProjectRef: PROJECT_REF,
      demoMode: false,
    });
  });

  it.each([
    ["incomplete Supabase configuration", { SUPABASE_URL: "" }],
    ["whitespace-only service role key", { SUPABASE_SERVICE_ROLE_KEY: "   " }],
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

  it("classifies a whitespace-only service role key as missing in the shared resolver", () => {
    expect(
      readSupabaseServerConfig({
        SUPABASE_URL: `https://${PROJECT_REF}.supabase.co`,
        SUPABASE_SERVICE_ROLE_KEY: "   ",
      }),
    ).toEqual({ status: "incomplete", missing: ["SUPABASE_SERVICE_ROLE_KEY"] });
    expect(readSupabaseServerConfig({ SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "  " })).toEqual(
      { status: "absent" },
    );
  });

  it("manifest scan detects attestation manifests (positive control)", () => {
    const fixture = mkdtempSync(join(tmpdir(), "attest-fixture-"));
    try {
      mkdirSync(join(fixture, "nested"));
      writeFileSync(join(fixture, "nested", "runtime-attestation.json"), "{}");
      writeFileSync(
        join(fixture, "other.json"),
        '{"supabaseProjectRef":"x","activeFeatureFlags":{}}',
      );
      writeFileSync(join(fixture, "unrelated.json"), "{}");
      expect(
        findAttestationManifests(fixture)
          .map((p) => p.slice(fixture.length))
          .sort(),
      ).toEqual([join("/", "nested", "runtime-attestation.json"), join("/", "other.json")].sort());
    } finally {
      rmSync(fixture, { recursive: true, force: true });
    }
  });

  it("does not publish an attestation manifest in public or built static assets", () => {
    const publicDir = join(repoRoot, "public");
    expect(existsSync(publicDir)).toBe(true);
    const staticDirectories = [publicDir, join(repoRoot, "dist"), join(repoRoot, ".output/public")];
    const manifests = staticDirectories.flatMap(findAttestationManifests);
    expect(manifests).toEqual([]);
  });
});
