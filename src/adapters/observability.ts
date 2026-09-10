/**
 * OBSERVABILITY ADAPTER
 *
 * A structured local logger that always works, plus Sentry/OpenTelemetry-ready
 * boundaries. Every payload is scrubbed of personal data and secrets before it
 * is logged or forwarded, and a correlation id follows a journey from checkout
 * through payment, order handoff and shipment.
 */

import { registerAdapter, resolveAdapter } from "./registry";

export type Severity = "debug" | "info" | "warn" | "error";

export type LogEvent = {
  message: string;
  severity: Severity;
  correlationId?: string;
  /** Scrubbed before it leaves this module. */
  context?: Record<string, unknown>;
};

const SECRET_KEY = /(token|secret|key|password|authorization|signature|otp|cvv|pan|card)/i;
const PII_KEY = /(email|phone|mobile|name|address|line1|line2|postal|pincode|gstin)/i;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const LONG_DIGITS = /\b\d{6,}\b/g;

/** Removes secrets and masks personal data anywhere in the payload. */
export function scrub(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[depth]";
  if (typeof value === "string") {
    return value.replace(EMAIL_RE, "[email]").replace(LONG_DIGITS, "[number]");
  }
  if (Array.isArray(value)) return value.map((item) => scrub(item, depth + 1));
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEY.test(key)) output[key] = "[redacted]";
      else if (PII_KEY.test(key)) output[key] = "[pii]";
      else output[key] = scrub(item, depth + 1);
    }
    return output;
  }
  return value;
}

export function newCorrelationId(prefix = "obs"): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export interface ObservabilityAdapter {
  readonly provider: string;
  capture(event: LogEvent): void;
}

const recent: Array<LogEvent & { at: string }> = [];

export const localObservability: ObservabilityAdapter = {
  provider: "local",
  capture(event) {
    const safe: LogEvent = {
      message: event.message,
      severity: event.severity,
      ...(event.correlationId ? { correlationId: event.correlationId } : {}),
      ...(event.context ? { context: scrub(event.context) as Record<string, unknown> } : {}),
    };
    recent.push({ ...safe, at: new Date().toISOString() });
    if (recent.length > 100) recent.shift();
    const line = JSON.stringify(safe);
    if (event.severity === "error") console.error(line);
    else if (event.severity === "warn") console.warn(line);
    else console.info(line);
  },
};

registerAdapter({
  id: "observability:local",
  domain: "observability",
  provider: "local",
  label: "Structured local logger",
  capabilities: ["structured-logs", "pii-scrubbing", "correlation-ids", "in-memory-summary"],
  requiredEnv: [],
  fallback: "Always available.",
  isFallback: true,
});

registerAdapter({
  id: "observability:sentry",
  domain: "observability",
  provider: "sentry",
  label: "Sentry (optional)",
  capabilities: ["error-capture", "performance", "release-health"],
  requiredEnv: ["VITE_SENTRY_DSN"],
  fallback: "Structured local logger.",
});

registerAdapter({
  id: "observability:otel",
  domain: "observability",
  provider: "otel",
  label: "OpenTelemetry collector (optional)",
  capabilities: ["traces", "spans", "provider-health"],
  requiredEnv: ["OTEL_EXPORTER_OTLP_ENDPOINT"],
  fallback: "Structured local logger.",
});

export function observability(): ObservabilityAdapter {
  // Remote providers still log locally until their SDK is deliberately added.
  resolveAdapter("observability");
  return localObservability;
}

export function recentEvents(): Array<LogEvent & { at: string }> {
  return [...recent];
}

/** Test helper. */
export function resetObservability(): void {
  recent.length = 0;
}
