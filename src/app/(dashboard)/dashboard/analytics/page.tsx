import { ChartLineIcon, EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { desc, eq, gte, sum } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { type ReactNode, Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ContentRankingChart,
  ViewsTimelineChart,
} from "@/features/dashboard/analytics/components/analytics-charts";
import {
  UmamiPanelClient,
  UmamiPanelSkeleton,
} from "@/features/dashboard/analytics/components/umami-panel";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";
import { galleryItem, post, project, viewEvent } from "@/lib/db/schema";
import { getUmamiAnalytics } from "@/lib/umami";
import AnalyticsLoading from "./loading";

type RankedContent = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus | ProjectStatus;
  viewCount: number;
};

const umamiShareUrl = process.env.UMAMI_SHARE_URL?.trim();

function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function getViewTimeline(events: { createdAt: Date }[]) {
  const today = startOfUtcDay(new Date());
  const counts = new Map<string, number>();

  for (const event of events) {
    const key = startOfUtcDay(event.createdAt).toISOString();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (29 - index));

    return {
      date,
      views: counts.get(date.toISOString()) ?? 0,
    };
  });
}

async function getAnalyticsData() {
  const timelineStart = startOfUtcDay(new Date());
  timelineStart.setUTCDate(timelineStart.getUTCDate() - 29);

  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalProjects,
    publishedProjects,
    galleryItems,
    postViews,
    projectViews,
    totalViewEvents,
    topPosts,
    topProjects,
    timelineEvents,
    recentViews,
  ] = await Promise.all([
    db.$count(post),
    db.$count(post, eq(post.status, PostStatus.PUBLISHED)),
    db.$count(post, eq(post.status, PostStatus.DRAFT)),
    db.$count(project),
    db.$count(project, eq(project.status, ProjectStatus.PUBLISHED)),
    db.$count(galleryItem),
    db
      .select({ viewCount: sum(post.viewCount).mapWith(Number) })
      .from(post)
      .then(([row]) => row?.viewCount ?? 0),
    db
      .select({ viewCount: sum(project.viewCount).mapWith(Number) })
      .from(project)
      .then(([row]) => row?.viewCount ?? 0),
    db.$count(viewEvent),
    db.query.post.findMany({
      orderBy: (table) => [desc(table.viewCount), desc(table.createdAt)],
      limit: 5,
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
      },
    }),
    db.query.project.findMany({
      orderBy: (table) => [desc(table.viewCount), desc(table.createdAt)],
      limit: 5,
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
      },
    }),
    db.query.viewEvent.findMany({
      where: (table) => gte(table.createdAt, timelineStart),
      columns: { createdAt: true },
    }),
    db.query.viewEvent.findMany({
      orderBy: (table) => [desc(table.createdAt)],
      limit: 5,
      columns: { id: true, type: true, slug: true, createdAt: true },
    }),
  ]);

  return {
    draftPosts,
    galleryItems,
    postViews: postViews,
    projectViews: projectViews,
    publishedPosts,
    publishedProjects,
    recentViews,
    timeline: getViewTimeline(timelineEvents),
    topPosts,
    topProjects,
    totalPosts,
    totalProjects,
    totalViewEvents,
  };
}

function EmptyState({
  description,
  icon,
  title,
}: {
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <div className="flex flex-col justify-center items-center gap-3 border border-dashed rounded-2xl min-h-48 text-center">
      <div className="text-muted-foreground/50 text-4xl">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}

function ViewsTimeline({
  timeline,
}: {
  timeline: { date: Date; views: number }[];
}) {
  const hasViews = timeline.some((point) => point.views > 0);
  const chartData = timeline.map((point) => ({
    date: point.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }),
    label: point.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }),
    views: point.views,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Views over 30 days</h2>
        </CardTitle>
        <CardDescription>
          {timeline
            .reduce((total, point) => total + point.views, 0)
            .toLocaleString("en-US")}{" "}
          locally tracked post and project views across 30 UTC calendar days,
          including today. Today is incomplete.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasViews ? (
          <EmptyState
            icon={<ChartLineIcon />}
            title="No recent views"
            description="New public content views will appear here."
          />
        ) : (
          <div className="min-w-0">
            <ViewsTimelineChart data={chartData} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RankingChart({
  items,
  title,
  kind,
}: {
  items: RankedContent[];
  title: string;
  kind: "posts" | "projects";
}) {
  function shortenTitle(value: string) {
    return value.length > 20 ? `${value.slice(0, 19).trimEnd()}...` : value;
  }

  const chartData = items.map((item) => ({
    name: item.title,
    shortName: shortenTitle(item.title),
    views: item.viewCount,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
        <CardDescription>
          Top five items by lifetime local view counter. Open a title to edit
          it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<ChartLineIcon />}
            title="No content yet"
            description="Content will appear here after it is created."
          />
        ) : (
          <div className="min-w-0">
            <ContentRankingChart data={chartData} />
            <ol className="mt-4 divide-y divide-border">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/${kind}/${item.id}/edit`}
                      className="underline underline-offset-4 wrap-anywhere"
                    >
                      {item.title}
                    </Link>
                    <p className="mt-1 text-muted-foreground text-xs">
                      {item.status.toLowerCase()}
                    </p>
                  </div>
                  <span className="tabular-nums shrink-0">
                    {item.viewCount.toLocaleString("en-US")} views
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentBreakdown({
  data,
}: {
  data: Awaited<ReturnType<typeof getAnalyticsData>>;
}) {
  const groups = [
    {
      label: "Posts",
      description: `${data.publishedPosts} published · ${data.draftPosts} drafts`,
      value: data.totalPosts,
    },
    {
      label: "Projects",
      description: `${data.publishedProjects} published`,
      value: data.totalProjects,
    },
    {
      label: "Gallery",
      description: "Stored gallery items, including hidden items",
      value: data.galleryItems,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Content inventory</h2>
        </CardTitle>
        <CardDescription>
          Current stored records and publication status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DashboardSummary items={groups} />
      </CardContent>
    </Card>
  );
}

function RecentViews({
  items,
}: {
  items: Awaited<ReturnType<typeof getAnalyticsData>>["recentViews"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Recent view events</h2>
        </CardTitle>
        <CardDescription>
          Latest local events across all recorded history. Times shown in UTC.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<EyeIcon />}
            title="No view events yet"
            description="Events appear after published posts or projects are viewed."
          />
        ) : (
          <div className="divide-y divide-border">
            {items.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap justify-between items-center gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    /{event.type === "post" ? "blog" : "projects"}/{event.slug}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {event.type} view
                  </p>
                </div>
                <time
                  dateTime={event.createdAt.toISOString()}
                  className="text-muted-foreground text-xs shrink-0"
                >
                  {event.createdAt.toLocaleString("en-US", {
                    timeZone: "UTC",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  UTC
                </time>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function UmamiPanelSection() {
  const analytics = await getUmamiAnalytics();

  return (
    <UmamiPanelClient
      initialAnalytics={analytics}
      shareUrl={umamiShareUrl || undefined}
    />
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <AnalyticsContent />
    </Suspense>
  );
}

async function AnalyticsContent() {
  await connection();
  const data = await getAnalyticsData();

  const stats = [
    {
      label: "Lifetime local views",
      value: data.postViews + data.projectViews,
      description: "Stored post and project counters",
    },
    {
      label: "Lifetime tracked events",
      value: data.totalViewEvents,
      description: "Stored local event records",
    },
  ];

  return (
    <div className={dashboardStyles.page}>
      <div>
        <h1 className="font-heading font-semibold text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
          Measure public traffic, local content performance, and recent view
          activity across Storylio.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-semibold text-lg">Lifetime local analytics</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Database counters and event records have different collection
            histories. Neither represents unique visitors or a 30-day total.
          </p>
        </div>

        <DashboardSummary items={stats} />
      </section>

      <div className="gap-6 grid xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <ViewsTimeline timeline={data.timeline} />
        <RecentViews items={data.recentViews} />
      </div>

      <div className="gap-6 grid xl:grid-cols-2">
        <RankingChart items={data.topPosts} title="Top posts" kind="posts" />
        <RankingChart
          items={data.topProjects}
          title="Top projects"
          kind="projects"
        />
      </div>

      <ContentBreakdown data={data} />
      <Suspense fallback={<UmamiPanelSkeleton />}>
        <UmamiPanelSection />
      </Suspense>
    </div>
  );
}
