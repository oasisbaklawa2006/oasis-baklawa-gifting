/**
 * Torch Bearer runtime attestation (server-only).
 *
 * Builds the frozen 6-key attestation payload from the same server-side
 * configuration authority the admin Supabase client uses. Pure over its
 * inputs (env + presented token) so it can be tested without a server.
 */

import { createHash, timingSafeEqual } from "node:crypto";

import { readSupabaseServerConfig } from "@/integrations/supabase/client.server";
import { paymentLaunchPolicy } from "@/payments/launch-policy";

export type AttestationEnvironment = "production" | "preview" | "development";

export type RuntimeAttestation = {
  app: "gifting";
  gitSha: string;
  environment: AttestationEnvironment;
  supabaseProjectRef: string | null;
  activeFeatureFlags: Record<string, boolean>;
  demoMode: boolean;
};

export type AttestationResult =
  { status: 200; body: RuntimeAttestation } | { status: 401 | 503; body: null };

type Env = Record<string, string | undefined>;

const GIT_SHA = /^[0-9a-f]{40}$/;
const PROJECT_REF = /^[a-z0-9]{20}$/;
const MIN_TOKEN_LENGTH = 32;

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** Constant-time check; hashing first makes lengths equal for timingSafeEqual. */
export function tokenMatches(
  presented: string | null | undefined,
  env: Env = process.env,
): boolean {
  const expected = (env["TORCH_ATTEST_TOKEN"] ?? "").trim();
  if (expected.length < MIN_TOKEN_LENGTH || !presented) return false;
  return timingSafeEqual(digest(presented.trim()), digest(expected));
}

function resolveGitSha(env: Env): string | null {
  for (const key of [
    "GIT_SHA",
    "COMMIT_SHA",
    "VERCEL_GIT_COMMIT_SHA",
    "CF_PAGES_COMMIT_SHA",
    "GITHUB_SHA",
  ]) {
    const value = (env[key] ?? "").trim();
    if (value) return GIT_SHA.test(value) ? value : null;
  }
  return null;
}

function resolveEnvironment(env: Env): AttestationEnvironment | null {
  const raw = (env["APP_ENVIRONMENT"] ?? env["VERCEL_ENV"] ?? env["NODE_ENV"] ?? "")
    .trim()
    .toLowerCase();
  return raw === "production" || raw === "preview" || raw === "development" ? raw : null;
}

/** Explicit allowlist. Every value must be a real boolean; anything else fails closed. */
function resolveFlags(): Record<string, boolean> | null {
  const flags: Record<string, boolean> = {
    paymentLaunchOperational: paymentLaunchPolicy.operational,
  };
  return Object.values(flags).every((v) => typeof v === "boolean") ? flags : null;
}

const SCOPED_ENQUIRY_PATH = "/functions/v1/gifting-enquiries";

/**
 * Option A production persists enquiries through Core's scoped Gifting Enquiries
 * endpoint and holds no database credential. The Core project that endpoint belongs
 * to is the project this runtime writes to, so its ref is attested instead.
 * Anything that is not an exact, https, credential-free Core function URL plus a
 * Connect token of the length the receiver requires is unbootable.
 */
function resolveScopedEnquiryProject(env: Env): { ref: string; demoMode: false } | null {
  const token = (env["GIFTING_ENQUIRIES_TOKEN"] ?? "").trim();
  if (token.length < MIN_TOKEN_LENGTH) return null;
  const endpoint = URL.parse((env["GIFTING_ENQUIRIES_ENDPOINT"] ?? "").trim());
  if (
    !endpoint ||
    endpoint.protocol !== "https:" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.port ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== SCOPED_ENQUIRY_PATH
  ) {
    return null;
  }
  const ref = /^([^.]+)\.supabase\.co$/.exec(endpoint.hostname)?.[1];
  return ref && PROJECT_REF.test(ref) ? { ref, demoMode: false } : null;
}

function resolveSupabase(
  env: Env,
  environment: AttestationEnvironment,
): { ref: string | null; demoMode: boolean } | null {
  const config = readSupabaseServerConfig(env);
  // Absent config is a bootable in-memory demo only outside production
  // (persistence and catalogue guard on these vars and fall back to memory).
  // In production the website must persist somewhere durable: either the website
  // database, or Core's scoped enquiry endpoint with no database credential.
  if (config.status === "absent") {
    return environment === "production"
      ? resolveScopedEnquiryProject(env)
      : { ref: null, demoMode: true };
  }
  if (config.status !== "configured") return null;
  if (!config.serviceRoleKey.trim()) return null;
  try {
    const url = new URL(config.url);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    const match = /^([^.]+)\.supabase\.co$/.exec(url.hostname);
    const ref = match?.[1];
    return ref && PROJECT_REF.test(ref) ? { ref, demoMode: false } : null;
  } catch {
    return null;
  }
}

export function buildRuntimeAttestation(
  presentedToken: string | null | undefined,
  env: Env = process.env,
): AttestationResult {
  if (!tokenMatches(presentedToken, env)) return { status: 401, body: null };

  const gitSha = resolveGitSha(env);
  const environment = resolveEnvironment(env);
  const supabase = environment ? resolveSupabase(env, environment) : null;
  const activeFeatureFlags = resolveFlags();
  if (!gitSha || !environment || !supabase || !activeFeatureFlags) {
    return { status: 503, body: null };
  }

  return {
    status: 200,
    body: {
      app: "gifting",
      gitSha,
      environment,
      supabaseProjectRef: supabase.ref,
      activeFeatureFlags,
      demoMode: supabase.demoMode,
    },
  };
}
