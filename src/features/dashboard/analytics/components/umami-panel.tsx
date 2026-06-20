"use client";

import { ArrowClockwiseIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { UmamiAnalytics } from "@/lib/umami";
import { cn } from "@/lib/utils";
import { actionRefreshUmamiAnalytics } from "../actions";

function formatDuration(seconds?: number) {
  if (seconds === undefined) {
    return "Unavailable";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (minutes <= 0) {
    return `${remainingSeconds}s`;
  }

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
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
  inverseTrend = false,
  label,
  stat,
  value,
}: {
  inverseTrend?: boolean;
  label: string;
  stat: UmamiAnalytics["pageviews"];
  value: string;
}) {
  const change = stat.change ?? (stat.value !== undefined ? 0 : undefined);
  const delta = formatDelta(change);
  const isPositive = (change ?? 0) > 0;
  const isNegative = (change ?? 0) < 0;
  const isGood = inverseTrend ? isNegative : isPositive;
  const isBad = inverseTrend ? isPositive : isNegative;

  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold md:text-3xl">
        {value}
      </p>
      {delta && (
        <p
          className={cn(
            "mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium",
            isGood && "bg-emerald-500/15 text-emerald-300",
            isBad && "bg-destructive/15 text-destructive",
            !isGood && !isBad && "bg-muted text-muted-foreground",
          )}
        >
          {delta}
        </p>
      )}
    </div>
  );
}

function UmamiMetricList({
  emptyDescription,
  items,
  title,
}: {
  emptyDescription: string;
  items: UmamiAnalytics["topPages"];
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
      <h3 className="font-heading font-semibold">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-3 divide-y divide-border/60">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-4 py-2 text-sm"
            >
              <span className="truncate text-muted-foreground">
                {item.name}
              </span>
              <span className="shrink-0 font-medium">
                {item.value.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">{emptyDescription}</p>
      )}
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
  const [isPending, startTransition] = useTransition();

  const refreshAnalytics = () => {
    startTransition(async () => {
      const nextAnalytics = await actionRefreshUmamiAnalytics();
      setAnalytics(nextAnalytics);
    });
  };

  if (analytics.status !== "available") {
    return (
      <Card className="border-border/70 bg-card/55 shadow-sm">
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Traffic Analytics</CardTitle>
            <CardDescription>
              Umami API and embed are optional. Local analytics remain
              available.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-fit rounded-2xl"
            disabled={isPending}
            onClick={refreshAnalytics}
          >
            <ArrowClockwiseIcon
              data-icon="inline-start"
              className={cn(isPending && "animate-spin")}
            />
            {isPending ? "Refreshing..." : "Retry"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed bg-background/40 p-6">
            <p className="font-medium">
              {analytics.status === "error"
                ? "Umami metrics are temporarily unavailable"
                : "Umami API is not configured"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {analytics.status === "error"
                ? `${analytics.error ?? "The API request failed."} Local analytics remain available.`
                : "Configure UMAMI_API_URL, UMAMI_USERNAME, UMAMI_PASSWORD, and UMAMI_WEBSITE_ID to load optional self-hosted traffic metrics."}
            </p>
          </div>
        </CardContent>
      </Card>
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
      inverseTrend: true,
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
    <Card className="border-border/70 bg-card/55 shadow-sm">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Umami Traffic Analytics</CardTitle>
            <Badge>Connected</Badge>
          </div>
          <CardDescription>
            Self-hosted traffic metrics from the last 30 days.
          </CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-2xl"
            disabled={isPending}
            onClick={refreshAnalytics}
          >
            <ArrowClockwiseIcon
              data-icon="inline-start"
              className={cn(isPending && "animate-spin")}
            />
            {isPending ? "Refreshing..." : "Refresh"}
          </Button>
          {shareUrl && (
            <Button asChild className="rounded-2xl" variant="outline">
              <Link href={shareUrl} target="_blank">
                Open Umami
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => (
            <UmamiStatCard key={item.label} {...item} />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          <UmamiMetricList
            title="Top Pages"
            items={analytics.topPages}
            emptyDescription="No page metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Top Referrers"
            items={analytics.referrers}
            emptyDescription="No referrer metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Environment"
            items={analytics.browsers}
            emptyDescription="No browser metrics were returned by Umami."
          />
          <UmamiMetricList
            title="Location"
            items={analytics.locations}
            emptyDescription="No location metrics were returned by Umami."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function UmamiPanelSkeleton() {
  return (
    <Card className="border-border/70 bg-card/55 shadow-sm">
      <CardHeader>
        <CardTitle>Umami Traffic Analytics</CardTitle>
        <CardDescription>
          Loading optional self-hosted traffic metrics.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {["Visitors", "Visits", "Views", "Bounce rate", "Visit duration"].map(
            (label) => (
              <div
                key={label}
                className="rounded-2xl border border-border/70 bg-background/40 p-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="mt-3 h-8 w-20 animate-pulse rounded-xl bg-muted" />
                <div className="mt-3 h-6 w-14 animate-pulse rounded-full bg-muted" />
              </div>
            ),
          )}
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {["Top Pages", "Top Referrers", "Environment", "Location"].map(
            (label) => (
              <div
                key={label}
                className="rounded-2xl border border-border/70 bg-background/40 p-4"
              >
                <h3 className="font-heading font-semibold">{label}</h3>
                <div className="mt-4 grid gap-3">
                  <div className="h-4 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ),
          )}
        </div>
      </CardContent>
    </Card>
  );
}
