/**
 * PRIVATE INTEGRATION STATUS SURFACE
 *
 * For authorized Oasis staff. Not linked from customer navigation, excluded
 * from the sitemap and marked noindex. It reports only configuration state and
 * connector health — never credentials, customer data or commercial figures.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, MinusCircle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { appverse, catalogueSource, commerceProvider } from "@/config/integrations";
import { integrationHealth } from "@/lib/commerce.functions";
import { marketingStatus } from "@/lib/marketing/status.functions";
import { marketingTelemetry } from "@/lib/marketing/dispatch";
import { loadedTagKeys } from "@/lib/marketing/scripts";
import { useConsent } from "@/lib/marketing/runtime";

export const Route = createFileRoute("/admin/status")({
  head: () => ({
    meta: [
      { title: "Integration status — Oasis Baklawa" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Internal integration and release readiness status." },
    ],
  }),
  component: StatusPage,
});

const icon = (status: string) =>
  status === "configured" ? (
    <CheckCircle2 className="size-4 text-sage" aria-hidden="true" />
  ) : status === "disabled" ? (
    <MinusCircle className="size-4 text-muted-foreground" aria-hidden="true" />
  ) : (
    <AlertTriangle className="size-4 text-gold" aria-hidden="true" />
  );

function StatusPage() {
  const consent = useConsent();
  const marketing = useQuery({
    queryKey: ["marketing-status"],
    queryFn: () => marketingStatus(),
    staleTime: 30_000,
  });
  const telemetry = marketingTelemetry();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["integration-health"],
    queryFn: () => integrationHealth(),
    staleTime: 30_000,
  });

  return (
    <div className="container-oasis section-y">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Internal</p>
          <h1 className="mt-3 font-display text-4xl">Website integration status</h1>
          <p className="mt-3 max-w-2xl text-[0.875rem] text-muted-foreground">
            Configuration and connector health for this deployment. No credentials or customer data
            are shown here.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <dl className="mt-10 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-border bg-premium p-5">
          <dt className="eyebrow">Commerce provider</dt>
          <dd className="mt-2 font-display text-xl capitalize">{commerceProvider}</dd>
        </div>
        <div className="rounded-sm border border-border bg-premium p-5">
          <dt className="eyebrow">Catalogue source</dt>
          <dd className="mt-2 font-display text-xl">{catalogueSource.mode}</dd>
        </div>
        <div className="rounded-sm border border-border bg-premium p-5">
          <dt className="eyebrow">Connector contract</dt>
          <dd className="mt-2 font-display text-xl">{appverse.contractVersion}</dd>
        </div>
      </dl>

      {isLoading ? (
        <p className="mt-10 text-sm text-muted-foreground">Checking connectors…</p>
      ) : isError ? (
        <p className="mt-10 text-sm text-muted-foreground">
          Status could not be read. Try refreshing; if it persists, check the server logs.
        </p>
      ) : data ? (
        <>
          <section className="mt-12">
            <h2 className="font-display text-2xl">Catalogue &amp; order handoff</h2>
            <div className="mt-4 rounded-sm border border-border p-5">
              <p className="flex items-center gap-2 text-[0.9375rem]">
                {icon(data.provider.ok ? "configured" : "not-configured")}
                {data.provider.detail}
              </p>
              <p className="mt-2 text-[0.8125rem] text-muted-foreground">
                Snapshot: {data.provider.snapshotVersion ?? "unknown"} · Checked{" "}
                {new Date(data.provider.checkedAt).toLocaleString("en-IN")}
              </p>
            </div>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl">Configuration readiness</h2>
            <ul className="mt-4 divide-y divide-border rounded-sm border border-border">
              {data.readiness.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                  <span className="mt-0.5">{icon(item.status)}</span>
                  <span className="min-w-[14rem] flex-1">
                    <span className="block text-[0.9375rem]">{item.label}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">
                      {item.status === "configured"
                        ? "Ready"
                        : item.status === "disabled"
                          ? "Not in use for this configuration"
                          : (item.requires ?? "Awaiting configuration")}
                    </span>
                  </span>
                  <span className="eyebrow shrink-0">{item.group}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-12">
            <h2 className="font-display text-2xl">Promotion &amp; measurement</h2>
            {marketing.isLoading ? (
              <p className="mt-4 text-sm text-muted-foreground">Checking marketing channels…</p>
            ) : marketing.data ? (
              <>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-sm border border-border bg-premium p-5">
                    <dt className="eyebrow">Shopping feed eligible</dt>
                    <dd className="mt-2 font-display text-xl">{marketing.data.feed.eligible}</dd>
                  </div>
                  <div className="rounded-sm border border-border bg-premium p-5">
                    <dt className="eyebrow">Feed excluded</dt>
                    <dd className="mt-2 font-display text-xl">{marketing.data.feed.excluded}</dd>
                  </div>
                  <div className="rounded-sm border border-border bg-premium p-5">
                    <dt className="eyebrow">Leads awaiting sync</dt>
                    <dd className="mt-2 font-display text-xl">
                      {marketing.data.leads.pending_sync}
                    </dd>
                  </div>
                </dl>

                <ul className="mt-4 divide-y divide-border rounded-sm border border-border">
                  {marketing.data.readiness.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
                      <span className="mt-0.5">{icon(item.status)}</span>
                      <span className="min-w-[14rem] flex-1">
                        <span className="block text-[0.9375rem]">{item.label}</span>
                        <span className="block text-[0.8125rem] text-muted-foreground">
                          {item.status === "configured"
                            ? "Ready"
                            : (item.requires ?? "Awaiting configuration")}
                        </span>
                      </span>
                      <span className="eyebrow shrink-0">{item.group}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-sm border border-border p-5">
                    <p className="eyebrow">Consent manager</p>
                    <p className="mt-2 text-[0.9375rem]">
                      {consent.decided ? "Decision recorded" : "Awaiting visitor decision"} · tags
                      loaded: {loadedTagKeys().length ? loadedTagKeys().join(", ") : "none"}
                    </p>
                  </div>
                  <div className="rounded-sm border border-border p-5">
                    <p className="eyebrow">Last dispatch (this session)</p>
                    {Object.keys(telemetry).length === 0 ? (
                      <p className="mt-2 text-[0.9375rem] text-muted-foreground">
                        No events dispatched yet.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1 text-[0.8125rem]">
                        {Object.entries(telemetry).map(([provider, record]) => (
                          <li key={provider}>
                            {provider}: {record.event} ·{" "}
                            {new Date(record.at).toLocaleTimeString("en-IN")} ·{" "}
                            {record.ok ? "ok" : "error"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {marketing.data.feed.excluded > 0 ? (
                  <div className="mt-4 rounded-sm border border-border p-5">
                    <p className="eyebrow">Why products are excluded from the feed</p>
                    <ul className="mt-2 space-y-1 text-[0.8125rem] text-muted-foreground">
                      {Object.entries(marketing.data.feed.missingCounts).map(([reason, count]) => (
                        <li key={reason}>
                          {reason}: {count}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">
                Marketing status could not be read.
              </p>
            )}
          </section>

          {appverse.consoleUrl ? (
            <p className="mt-10">
              <a
                className="underline underline-offset-4"
                href={appverse.consoleUrl}
                rel="noreferrer noopener"
              >
                Open Oasis Central console
              </a>
            </p>
          ) : (
            <p className="mt-10 text-[0.8125rem] text-muted-foreground">
              Central console link appears here once an approved console URL is configured.
            </p>
          )}
        </>
      ) : null}
    </div>
  );
}
