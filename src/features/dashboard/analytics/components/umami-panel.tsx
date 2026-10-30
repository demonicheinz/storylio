"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UmamiAnalytics, UmamiDetailResult } from "@/lib/umami";
import { cn } from "@/lib/utils";
import { actionRefreshUmamiAnalytics } from "../actions";

function formatDuration(seconds?: number) {
  if (seconds === undefined || !Number.isFinite(seconds)) {
    return "Unavailable";
  }

  const roundedSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(roundedSeconds / 60);
  const remainingSeconds = roundedSeconds % 60;

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function formatDate(value: string | number, includeTime = false) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    ...(includeTime ? { timeStyle: "short" as const } : {}),
    timeZone: "UTC",
  }).format(new Date(value));
}

function UmamiFreshness({ fetchedAt }: { fetchedAt?: string }) {
  return fetchedAt ? (
    <>
      Fetched{" "}
      <time dateTime={fetchedAt}>{formatDate(fetchedAt, true)} UTC</time>
    </>
  ) : (
    <>Fetch time unavailable</>
  );
}

function UmamiRange({ range }: { range?: UmamiAnalytics["range"] }) {
  return range ? (
    <>
      {formatDate(range.startAt)} – {formatDate(range.endAt)} (UTC)
    </>
  ) : null;
}

const detailKeys = ["topPages", "referrers", "browsers", "locations"] as const;

function retainFailedDetails(
  previous: UmamiAnalytics,
  next: UmamiAnalytics,
): UmamiAnalytics {
  if (previous.status !== "available") return next;

  const merged = { ...next, details: { ...next.details } };
  for (const key of detailKeys) {
    if (next.details?.[key]?.status !== "error") continue;
    const lastResult = previous.details?.[key];
    if (
      previous[key].length ||
      (lastResult && lastResult.status !== "error") ||
      lastResult?.stale
    ) {
      merged[key] = previous[key];
      merged.details[key] = { ...lastResult, status: "error", stale: true };
    }
  }
  return merged;
}

function formatDelta(value?: number) {
  if (!Number.isFinite(value)) {
    return null;
  }

  const rounded = Math.round(value ?? 0);
  const prefix = rounded > 0 ? "↑ " : rounded < 0 ? "↓ " : "";

  return `${prefix}${Math.abs(rounded).toLocaleString("en-US")}%`;
}

function UmamiStatCard({
  label,
  stat,
  value,
}: {
  label: string;
  stat: UmamiAnalytics["pageviews"];
  value: string;
}) {
  const change = stat.change;
  const delta = formatDelta(change);

  return (
    <div className="py-2 min-w-0 wrap-anywhere">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-lg">{value}</p>
      {delta && (
        <p className="mt-1 text-muted-foreground text-xs">
          {delta} vs previous 30 days
        </p>
      )}
    </div>
  );
}

function UmamiMetricList({
  emptyDescription,
  items,
  title,
  result,
}: {
  emptyDescription: string;
  items: UmamiAnalytics["topPages"];
  title: string;
  result?: UmamiDetailResult;
}) {
  return (
    <div className="min-w-0">
      <h3 className="font-medium">{title}</h3>
      {result?.status === "error" && (
        <p className="mt-2 text-muted-foreground text-sm">
          {result.stale
            ? `${title} could not be refreshed. Last available results may be stale.`
            : `${title} could not be loaded. Retry to request these details.`}
          {result.stale && (
            <span className="block mt-1 text-xs">
              <UmamiFreshness fetchedAt={result.fetchedAt} />
              {result.range && (
                <>
                  {" "}
                  · <UmamiRange range={result.range} />
                </>
              )}
            </span>
          )}
        </p>
      )}
      {items.length > 0 ? (
        <ul className="mt-3 divide-y divide-border/60">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${index}`}
              className="flex justify-between items-start gap-4 py-2 text-sm"
            >
              <span className="min-w-0 text-muted-foreground wrap-anywhere">
                {item.name}
              </span>
              <span className="font-medium tabular-nums shrink-0">
                {item.value.toLocaleString("en-US")}
              </span>
            </li>
          ))}
        </ul>
      ) : result?.status !== "error" ? (
        <p className="mt-3 text-muted-foreground text-sm">{emptyDescription}</p>
      ) : null}
    </div>
  );
}

export function UmamiPanelClient({
  initialAnalytics,
  shareUrl,
}: {
  initialAnalytics: UmamiAnalytics;
  shareUrl?: string;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [refreshFailure, setRefreshFailure] = useState<
    "error" | "not-configured" | null
  >(null);
  const [isPending, setIsPending] = useState(false);
  const inFlight = useRef(false);

  const refreshAnalytics = async () => {
    if (
      inFlight.current ||
      analytics.status === "not-configured" ||
      refreshFailure === "not-configured"
    )
      return;
    inFlight.current = true;
    setIsPending(true);
    try {
      const nextAnalytics = await actionRefreshUmamiAnalytics();
      if (nextAnalytics.status === "available") {
        setAnalytics((previous) =>
          retainFailedDetails(previous, nextAnalytics),
        );
        setRefreshFailure(null);
      } else {
        setRefreshFailure(nextAnalytics.status);
        setAnalytics((previous) =>
          previous.status === "available" ? previous : nextAnalytics,
        );
      }
    } catch {
      setRefreshFailure("error");
    } finally {
      inFlight.current = false;
      setIsPending(false);
    }
  };

  const notConfigured =
    analytics.status === "not-configured" ||
    refreshFailure === "not-configured";
  const detailFailed = detailKeys.some(
    (key) => analytics.details?.[key]?.status === "error",
  );
  const hasStaleDetails = detailKeys.some(
    (key) => analytics.details?.[key]?.stale,
  );
  const refreshButton = !notConfigured && (
    <Button
      type="button"
      variant="outline"
      className="rounded-md min-h-11"
      disabled={isPending}
      onClick={refreshAnalytics}
    >
      <ArrowClockwiseIcon
        aria-hidden="true"
        data-icon="inline-start"
        className={cn(
          "motion-reduce:animate-none",
          isPending && "animate-spin",
        )}
      />
      Refresh Umami
    </Button>
  );

  if (analytics.status !== "available") {
    return (
      <section
        aria-label="Optional Umami traffic"
        aria-busy={isPending}
        className="flex flex-wrap justify-between items-center gap-4 bg-card p-4 sm:p-6 border rounded-lg font-sans"
      >
        <p className="text-muted-foreground text-sm" role="status">
          {isPending
            ? "Refreshing Umami traffic…"
            : notConfigured
              ? "Umami traffic is not configured. Add Umami credentials and the website ID to the server configuration to connect."
              : "Umami traffic could not be loaded. Retry to request traffic from Umami."}{" "}
          Local content analytics remain available separately.
        </p>
        {refreshButton}
      </section>
    );
  }

  const statCards = [
    {
      label: "Visitors",
      stat: analytics.visitors,
      value: analytics.visitors.value?.toLocaleString("en-US") ?? "Unavailable",
    },
    {
      label: "Visits",
      stat: analytics.visits,
      value: analytics.visits.value?.toLocaleString("en-US") ?? "Unavailable",
    },
    {
      label: "Views",
      stat: analytics.pageviews,
      value:
        analytics.pageviews.value?.toLocaleString("en-US") ?? "Unavailable",
    },
    {
      label: "Bounce rate",
      stat: analytics.bounceRate,
      value:
        analytics.bounceRate.value !== undefined
          ? `${Math.round(analytics.bounceRate.value)}%`
          : "Unavailable",
    },
    {
      label: "Visit duration",
      stat: analytics.visitDuration,
      value: formatDuration(analytics.visitDuration.value),
    },
  ];

  return (
    <Card
      aria-label="Umami traffic"
      aria-busy={isPending}
      className="rounded-lg font-sans"
    >
      <CardHeader className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4 px-4 sm:px-6">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h2>Umami traffic</h2>
            </CardTitle>
            <Badge>
              {refreshFailure || hasStaleDetails
                ? "Stale data"
                : detailFailed || analytics.comparisonStatus === "error"
                  ? "Partial data"
                  : "Available"}
            </Badge>
          </div>
          <CardDescription>
            Self-hosted Umami traffic · Rolling 30 days.
            {analytics.range && (
              <span className="block mt-1">
                <UmamiRange range={analytics.range} />
              </span>
            )}
            <span className="block mt-1">
              Separate from local content analytics.
            </span>
          </CardDescription>
          <p className="text-muted-foreground text-xs">
            <UmamiFreshness fetchedAt={analytics.fetchedAt} />
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {refreshButton}
          {shareUrl && (
            <Button
              role="link"
              render={
                <Link
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
              nativeButton={false}
              variant="outline"
              className="rounded-md min-h-11"
            >
              Open Umami (new tab)
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-4 sm:px-6">
        <p
          role="status"
          aria-atomic="true"
          className="text-muted-foreground text-sm"
        >
          {isPending
            ? "Refreshing Umami traffic…"
            : notConfigured
              ? "Umami is no longer configured. Showing last available data; it may be stale. Check the server configuration to reconnect."
              : refreshFailure
                ? "Umami refresh failed. Showing last available data; it may be stale. Retry to request updated traffic."
                : detailFailed
                  ? "Some Umami details could not be loaded. Available results are shown. Retry to refresh Umami."
                  : analytics.comparisonStatus === "error"
                    ? "Previous-period comparison is unavailable. Retry to refresh Umami."
                    : "Umami traffic loaded. Comparisons, when available, use the previous 30 days."}
        </p>
        <div className="gap-x-4 gap-y-2 grid grid-cols-2 lg:grid-cols-5">
          {statCards.map((item) => (
            <UmamiStatCard key={item.label} {...item} />
          ))}
        </div>
        <div className="gap-x-8 gap-y-6 grid md:grid-cols-2">
          <UmamiMetricList
            title="Top pages"
            items={analytics.topPages}
            result={analytics.details?.topPages}
            emptyDescription="No page metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Top referrers"
            items={analytics.referrers}
            result={analytics.details?.referrers}
            emptyDescription="No referrer metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Browsers"
            items={analytics.browsers}
            result={analytics.details?.browsers}
            emptyDescription="No browser metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Countries"
            items={analytics.locations}
            result={analytics.details?.locations}
            emptyDescription="No country metrics were returned by Umami."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function UmamiPanelSkeleton() {
  return (
    <p
      role="status"
      aria-busy="true"
      className="bg-card p-4 sm:p-6 border rounded-lg font-sans text-muted-foreground text-sm"
    >
      Loading optional Umami traffic…
    </p>
  );
}
