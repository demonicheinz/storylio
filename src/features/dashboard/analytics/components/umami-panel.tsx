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
    <div className="py-2">
      <p className="text-muted-foreground text-sm">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-lg">{value}</p>
      {delta && (
        <p className="mt-1 text-muted-foreground text-xs">
          {delta} vs previous period
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
    <div>
      <h3 className="font-medium">{title}</h3>
      {items.length > 0 ? (
        <div className="mt-3 divide-y divide-border/60">
          {items.map((item) => (
            <div
              key={item.name}
              className="flex justify-between items-center gap-4 py-2 text-sm"
            >
              <span className="text-muted-foreground truncate">
                {item.name}
              </span>
              <span className="font-medium shrink-0">
                {item.value.toLocaleString("en-US")}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-muted-foreground text-sm">{emptyDescription}</p>
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
      <section
        aria-label="Optional Umami traffic"
        className="flex flex-wrap justify-between items-center gap-3 py-3 border-t"
      >
        <p className="text-muted-foreground text-sm" role="status">
          {analytics.status === "error"
            ? "Optional Umami traffic is temporarily unavailable."
            : "Optional Umami traffic is not configured."}{" "}
          Local analytics remain available.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={refreshAnalytics}
        >
          <ArrowClockwiseIcon
            data-icon="inline-start"
            className={cn(isPending && "animate-spin")}
          />
          {isPending ? "Refreshing..." : "Retry"}
        </Button>
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
    <Card>
      <CardHeader className="sm:flex-row sm:justify-between sm:items-start gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>
              <h2>Umami traffic</h2>
            </CardTitle>
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
            <Button
              role="link"
              render={<Link href={shareUrl} target="_blank" />}
              nativeButton={false}
              variant="outline"
            >
              Open Umami
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="gap-3 grid md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => (
            <UmamiStatCard key={item.label} {...item} />
          ))}
        </div>
        <div className="gap-4 grid xl:grid-cols-2">
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
    <p
      role="status"
      aria-busy="true"
      className="py-3 border-t text-muted-foreground text-sm"
    >
      Loading optional Umami traffic…
    </p>
  );
}
