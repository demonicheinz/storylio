import {
  CaretDownIcon,
  ChartLineIcon,
  ClockIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPostPublicationState } from "@/features/dashboard/posts/publication-state";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import type { AnalyticsData } from "../queries";
import styles from "./analytics.module.css";
import { ViewsTimelineChart } from "./analytics-charts";

function number(value: number) {
  return value.toLocaleString("en-US");
}
function date(value: Date | string, withTime = false) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: "UTC",
    dateStyle: "medium",
    ...(withTime ? { timeStyle: "short" as const } : {}),
  });
}

function Empty({ title, children }: { title: string; children: string }) {
  return (
    <div className="flex flex-col justify-center items-center gap-2 min-h-44 text-center">
      <ChartLineIcon
        className="mb-1 size-6 text-muted-foreground"
        aria-hidden
      />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-muted-foreground text-sm">{children}</p>
    </div>
  );
}

type RankedItem =
  | AnalyticsData["topPosts"][number]
  | AnalyticsData["topProjects"][number];

function Ranking({
  items,
  kind,
  now,
}: {
  items: RankedItem[];
  kind: "posts" | "projects";
  now: number;
}) {
  const max = Math.max(0, ...items.map((item) => item.viewCount));
  return (
    <Card>
      <CardHeader className={styles.cardHeader}>
        <CardTitle>
          <h2 className={styles.sectionTitle}>Top {kind}</h2>
        </CardTitle>
        <CardDescription>
          Lifetime views · includes unpublished records. Open a title to edit.
        </CardDescription>
      </CardHeader>
      <CardContent className={styles.cardContent}>
        {!items.length ? (
          <Empty
            title={`No ${kind} yet`}
          >{`Your ${kind} will appear here after you create them.`}</Empty>
        ) : (
          <ol className="divide-y divide-border/60">
            {items.map((item, index) => {
              const state = getPostPublicationState(
                item.status,
                "publishedAt" in item ? item.publishedAt?.toISOString() : null,
                now,
              );
              const label =
                state === "scheduled"
                  ? "Scheduled"
                  : state === "published"
                    ? "Published"
                    : "Draft";
              return (
                <li key={item.id} className={styles.rankingRow}>
                  <span
                    className="pt-3.5 tabular-nums text-muted-foreground text-xs"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className={styles.rankingHeading}>
                      <Link
                        href={`/dashboard/${kind}/${item.id}/edit`}
                        className={styles.titleLink}
                      >
                        {item.title}
                      </Link>
                      <span className="tabular-nums text-sm shrink-0">
                        <span className="font-semibold">
                          {number(item.viewCount)}
                        </span>{" "}
                        <span className="text-muted-foreground">views</span>
                      </span>
                    </div>
                    <span data-state={state} className={styles.status}>
                      {state === "scheduled" ? (
                        <ClockIcon className="size-3" aria-hidden />
                      ) : (
                        <span className={styles.statusDot} aria-hidden />
                      )}
                      {label}
                    </span>
                    <div
                      className="bg-muted mt-3 rounded-full h-1 overflow-hidden"
                      aria-hidden
                    >
                      <div
                        className="bg-primary rounded-full h-full"
                        style={{
                          width: `${max > 0 ? (item.viewCount / max) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsLocalView({ data }: { data: AnalyticsData }) {
  const total = data.timeline.reduce((sum, item) => sum + item.views, 0);
  const points = data.timeline.map((point) => ({
    date: date(`${point.date}T00:00:00Z`),
    label: new Date(`${point.date}T00:00:00Z`).toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }),
    views: point.views,
  }));
  return (
    <div className="flex flex-col gap-6 min-w-0">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <p className="max-w-2xl text-muted-foreground text-sm leading-6">
          Local post and project views. Repeat views of the same content in one
          browser are counted once per 24 hours; these are not unique visitors.
        </p>
        <p className="text-muted-foreground text-xs leading-6">
          Snapshot{" "}
          <time dateTime={data.generatedAt.toISOString()}>
            {date(data.generatedAt, true)} UTC
          </time>
        </p>
      </div>
      <Card>
        <CardHeader className={styles.cardHeader}>
          <CardTitle>
            <h2 className={styles.sectionTitle}>Views over 30 days</h2>
          </CardTitle>
          <CardDescription>
            <span className="font-semibold tabular-nums text-foreground">
              {number(total)} views
            </span>{" "}
            across 30 UTC calendar days, including today. Today is incomplete.
          </CardDescription>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {total > 0 ? (
            <ViewsTimelineChart data={points} />
          ) : (
            <Empty title="No recent views">
              New public content views will appear here.
            </Empty>
          )}
          <details className="group mt-4 border-border border-t">
            <summary className={styles.summary}>
              View daily values
              <CaretDownIcon className={styles.chevron} aria-hidden />
            </summary>
            <div
              className="max-h-72 overflow-auto"
              data-lenis-prevent="true"
              tabIndex={0}
              role="region"
              aria-label="Daily view values"
            >
              <table className="w-full text-sm">
                <caption className="sr-only">Daily views (UTC)</caption>
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th scope="col" className="py-2 font-medium text-left">
                      Date (UTC)
                    </th>
                    <th scope="col" className="py-2 font-medium text-right">
                      Views
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeline.map((point) => (
                    <tr key={point.date} className="border-border/60 border-t">
                      <th scope="row" className="py-2 font-normal text-left">
                        <time dateTime={point.date}>
                          {date(`${point.date}T00:00:00Z`)}
                        </time>
                      </th>
                      <td className="py-2 tabular-nums text-right">
                        {number(point.views)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </CardContent>
      </Card>
      <div className="gap-6 grid lg:grid-cols-2 min-w-0">
        <Ranking
          items={data.topPosts}
          kind="posts"
          now={data.generatedAt.getTime()}
        />
        <Ranking
          items={data.topProjects}
          kind="projects"
          now={data.generatedAt.getTime()}
        />
      </div>
      <div className="border-border border-y divide-y divide-border">
        <details className="group">
          <summary className={styles.summary}>
            Recent activity
            <CaretDownIcon className={styles.chevron} aria-hidden />
          </summary>
          <p className="pb-3 text-muted-foreground text-xs leading-5">
            Latest five recorded events across all history. Times shown in UTC.
          </p>
          {data.recentViews.length ? (
            <ol className="pb-4 divide-y divide-border/60">
              {data.recentViews.map((event) => (
                <li
                  key={event.id}
                  className="flex flex-wrap justify-between items-baseline gap-x-6 gap-y-1 py-3"
                >
                  <div className="flex-1 min-w-0 basis-52">
                    <p className="text-sm wrap-anywhere">
                      /{event.type === "post" ? "blog" : "projects"}/
                      {event.slug}
                    </p>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {event.type} view
                    </p>
                  </div>
                  <time
                    className="text-muted-foreground text-xs"
                    dateTime={event.createdAt.toISOString()}
                  >
                    {date(event.createdAt, true)} UTC
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="pb-4 text-muted-foreground text-sm">
              No view events yet.
            </p>
          )}
        </details>
        <details className="group">
          <summary className={styles.summary}>
            Lifetime details
            <CaretDownIcon className={styles.chevron} aria-hidden />
          </summary>
          <p className="pb-3 max-w-2xl text-muted-foreground text-sm leading-6">
            Stored counters and event records can have different collection
            histories. These totals cover all history, including records that
            are now unpublished.
          </p>
          <DashboardSummary
            items={[
              {
                label: "Content views",
                value: number(data.postViews + data.projectViews),
              },
              { label: "Tracked events", value: number(data.totalViewEvents) },
            ]}
          />
          <p className="py-4 text-muted-foreground text-xs leading-6">
            Posts at this snapshot: {data.publishedPosts} published ·{" "}
            {data.scheduledPosts} scheduled · {data.draftPosts}{" "}
            {data.draftPosts === 1 ? "draft" : "drafts"}.
          </p>
        </details>
      </div>
    </div>
  );
}
