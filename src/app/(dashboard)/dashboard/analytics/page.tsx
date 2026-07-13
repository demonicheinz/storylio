import {
  ArticleIcon,
  ChartLineIcon,
  EyeIcon,
  FolderIcon,
  ImagesIcon,
  QuotesIcon,
} from "@phosphor-icons/react/dist/ssr";
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
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { PostStatus, ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { getUmamiAnalytics } from "@/lib/umami";
import { cn, formatDate } from "@/lib/utils";

type AnalyticsStatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
  iconClassName: string;
};

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
    testimonials,
    postViews,
    projectViews,
    totalViewEvents,
    topPosts,
    topProjects,
    timelineEvents,
    recentViews,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: PostStatus.PUBLISHED } }),
    db.post.count({ where: { status: PostStatus.DRAFT } }),
    db.project.count(),
    db.project.count({ where: { status: ProjectStatus.PUBLISHED } }),
    db.galleryItem.count(),
    db.testimonial.count(),
    db.post.aggregate({ _sum: { viewCount: true } }),
    db.project.aggregate({ _sum: { viewCount: true } }),
    db.viewEvent.count(),
    db.post.findMany({
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
      },
    }),
    db.project.findMany({
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
      },
    }),
    db.viewEvent.findMany({
      where: { createdAt: { gte: timelineStart } },
      select: { createdAt: true },
    }),
    db.viewEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        type: true,
        slug: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    draftPosts,
    galleryItems,
    postViews: postViews._sum.viewCount ?? 0,
    projectViews: projectViews._sum.viewCount ?? 0,
    publishedPosts,
    publishedProjects,
    recentViews,
    testimonials,
    timeline: getViewTimeline(timelineEvents),
    topPosts,
    topProjects,
    totalPosts,
    totalProjects,
    totalViewEvents,
  };
}

function AnalyticsStatCard({
  description,
  icon,
  iconClassName,
  label,
  value,
}: AnalyticsStatCardProps) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-xl">
            {value.toLocaleString("en-US")}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
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
    }),
    label: point.date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    views: point.views,
  }));

  return (
    <Card className="bg-card/55 shadow-sm border-border/70">
      <CardHeader>
        <CardTitle>Views Over Time</CardTitle>
        <CardDescription>
          Locally tracked post and project views from the last 30 days.
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
          <div className="bg-background/40 p-4 border border-border/70 rounded-2xl">
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
}: {
  items: RankedContent[];
  title: string;
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
    <Card className="bg-card/55 shadow-sm border-border/70">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Top five items by local view count.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<ChartLineIcon />}
            title="No content yet"
            description="Content will appear here after it is created."
          />
        ) : (
          <div className="bg-background/40 p-4 border border-border/70 rounded-2xl">
            <ContentRankingChart data={chartData} />
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
      icon: <ArticleIcon />,
      label: "Posts",
      meta: `${data.publishedPosts} published · ${data.draftPosts} drafts`,
      value: data.totalPosts,
    },
    {
      icon: <FolderIcon />,
      label: "Projects",
      meta: `${data.publishedProjects} published`,
      value: data.totalProjects,
    },
    {
      icon: <ImagesIcon />,
      label: "Gallery",
      meta: "Public visual archive",
      value: data.galleryItems,
    },
    {
      icon: <QuotesIcon />,
      label: "Testimonials",
      meta: "Home page quotes",
      value: data.testimonials,
    },
  ];

  return (
    <Card className="bg-card/55 shadow-sm border-border/70">
      <CardHeader>
        <CardTitle>Content Breakdown</CardTitle>
        <CardDescription>
          A compact inventory of dashboard content health.
        </CardDescription>
      </CardHeader>
      <CardContent className="gap-3 grid md:grid-cols-2 xl:grid-cols-4">
        {groups.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-3 bg-background/40 p-4 border border-border/70 rounded-2xl min-w-0"
          >
            <div className="flex justify-center items-center bg-primary/10 rounded-2xl size-10 text-primary shrink-0">
              {item.icon}
            </div>
            <div className="min-w-0">
              <p className="font-heading font-bold text-xl">
                {item.value.toLocaleString("en-US")}
              </p>
              <p className="text-muted-foreground text-xs">{item.label}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground/80 truncate">
                {item.meta}
              </p>
            </div>
          </div>
        ))}
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
    <Card className="bg-card/55 shadow-sm border-border/70">
      <CardHeader>
        <CardTitle>Recent Views</CardTitle>
        <CardDescription>
          Latest privacy-friendly local content view events.
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
          <div className="bg-background/40 border border-border/70 rounded-2xl divide-y divide-border/60">
            {items.map((event) => (
              <div
                key={event.id}
                className="flex justify-between items-center gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    /{event.type === "post" ? "blog" : "projects"}/{event.slug}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    {event.type} view
                  </p>
                </div>
                <span className="text-muted-foreground text-xs shrink-0">
                  {formatDate(event.createdAt)}
                </span>
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

export default async function AnalyticsPage() {
  await connection();
  const data = await getAnalyticsData();

  const stats = [
    {
      label: "Local Views",
      value: data.postViews + data.projectViews,
      description: "Post and project view counters.",
      icon: <EyeIcon />,
      iconClassName: "bg-sky-500/12 text-sky-300",
    },
    {
      label: "Tracked Events",
      value: data.totalViewEvents,
      description: "Privacy-friendly local events.",
      icon: <ChartLineIcon />,
      iconClassName: "bg-emerald-500/12 text-emerald-300",
    },
    {
      label: "Published Posts",
      value: data.publishedPosts,
      description: `${data.draftPosts} drafts still hidden.`,
      icon: <ArticleIcon />,
      iconClassName: "bg-fuchsia-500/12 text-fuchsia-300",
    },
    {
      label: "Published Projects",
      value: data.publishedProjects,
      description: `${data.totalProjects} total portfolio items.`,
      icon: <FolderIcon />,
      iconClassName: "bg-amber-500/12 text-amber-300",
    },
  ];

  return (
    <div className={dashboardStyles.page}>
      <div>
        <h1 className="font-heading font-bold text-3xl">Analytics</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
          Measure public traffic, local content performance, and recent view
          activity across Storylio.
        </p>
      </div>

      <Suspense fallback={<UmamiPanelSkeleton />}>
        <UmamiPanelSection />
      </Suspense>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading font-semibold text-xl">
            Local Content Analytics
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Database-backed metrics that work without external analytics.
          </p>
        </div>

        <div className={dashboardStyles.statGrid}>
          {stats.map((stat) => (
            <AnalyticsStatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <div className="gap-6 grid xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <ViewsTimeline timeline={data.timeline} />
        <RecentViews items={data.recentViews} />
      </div>

      <div className="gap-6 grid xl:grid-cols-2">
        <RankingChart items={data.topPosts} title="Top Posts" />
        <RankingChart items={data.topProjects} title="Top Projects" />
      </div>

      <ContentBreakdown data={data} />
    </div>
  );
}
