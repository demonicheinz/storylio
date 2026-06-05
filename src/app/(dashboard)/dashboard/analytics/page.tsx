import {
  ArticleIcon,
  ChartLineIcon,
  EyeIcon,
  FolderIcon,
  ImagesIcon,
  QuotesIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { PostStatus, ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

type AnalyticsStatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
};

type RankedContent = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus | ProjectStatus;
  viewCount: number;
};

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL?.trim();
const umamiWebsiteId =
  process.env.UMAMI_WEBSITE_ID?.trim() ??
  process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

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
      take: 8,
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
  label,
  value,
}: AnalyticsStatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardDescription>{label}</CardDescription>
          <CardTitle className="mt-2 font-heading text-3xl">
            {value.toLocaleString("en-US")}
          </CardTitle>
        </div>
        <div className="rounded-2xl border bg-muted/40 p-2 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
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
    <Card>
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
          <div className="rounded-2xl border bg-background/40 p-4">
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
    <Card>
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
          <div className="rounded-2xl border bg-background/40 p-4">
            <ContentRankingChart data={chartData} />
          </div>
        )}
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
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center">
      <div className="text-4xl text-muted-foreground/50">{icon}</div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function TopContentList({
  editPath,
  items,
  publicPath,
  title,
}: {
  editPath: "posts" | "projects";
  items: RankedContent[];
  publicPath: "blog" | "projects";
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Top 5 items ordered by local view count.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={<ChartLineIcon />}
            title="No content yet"
            description="Create and publish content to populate this list."
          />
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const isPublished = item.status === "PUBLISHED";

              return (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <div className="flex items-start gap-2">
                      <h2
                        className="line-clamp-2 min-w-0 font-heading text-base font-semibold"
                        title={item.title}
                      >
                        {item.title}
                      </h2>
                      <Badge
                        className="mt-0.5 shrink-0"
                        variant={isPublished ? "default" : "secondary"}
                      >
                        {isPublished ? "published" : "draft"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      /{publicPath}/{item.slug}
                    </p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {item.viewCount.toLocaleString("en-US")} views
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {isPublished && (
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/${publicPath}/${item.slug}`}
                          target="_blank"
                        >
                          View
                        </Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/dashboard/${editPath}/${item.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function UmamiPanel() {
  if (umamiShareUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Analytics</CardTitle>
          <CardDescription>
            Embedded Umami traffic dashboard from the configured share URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-2xl border bg-background/40">
            <iframe
              src={umamiShareUrl}
              title="Umami traffic analytics"
              className="h-[640px] w-full bg-background"
              loading="lazy"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Analytics</CardTitle>
        <CardDescription>
          Umami API and embed are optional. Local analytics remain available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed bg-background/40 p-6">
          <p className="font-medium">
            {umamiWebsiteId
              ? "Umami website configured without a share URL"
              : "Umami is not configured"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure `NEXT_PUBLIC_UMAMI_SHARE_URL` to embed traffic analytics.
            Server-side Umami API integration remains deferred until its API
            version and response contract are confirmed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AnalyticsPage() {
  await connection();
  const data = await getAnalyticsData();

  const stats = [
    {
      label: "Total posts",
      value: data.totalPosts,
      description: "All blog posts stored in the database.",
      icon: <ArticleIcon />,
    },
    {
      label: "Published posts",
      value: data.publishedPosts,
      description: "Posts currently visible on the public blog.",
      icon: <ArticleIcon />,
    },
    {
      label: "Draft posts",
      value: data.draftPosts,
      description: "Posts hidden from public readers.",
      icon: <ArticleIcon />,
    },
    {
      label: "Total post views",
      value: data.postViews,
      description: "Total views counted from local Post.viewCount.",
      icon: <EyeIcon />,
    },
    {
      label: "Total projects",
      value: data.totalProjects,
      description: "Portfolio projects stored in the database.",
      icon: <FolderIcon />,
    },
    {
      label: "Published projects",
      value: data.publishedProjects,
      description: "Projects visible on the public portfolio.",
      icon: <FolderIcon />,
    },
    {
      label: "Total project views",
      value: data.projectViews,
      description: "Total views counted from local Project.viewCount.",
      icon: <EyeIcon />,
    },
    {
      label: "Tracked view events",
      value: data.totalViewEvents,
      description: "Privacy-friendly local events used for trend charts.",
      icon: <ChartLineIcon />,
    },
    {
      label: "Gallery items",
      value: data.galleryItems,
      description: "Images available in the public gallery.",
      icon: <ImagesIcon />,
    },
    {
      label: "Testimonials",
      value: data.testimonials,
      description: "Client quotes available for the Home page.",
      icon: <QuotesIcon />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Measure local content performance and optionally connect broader
          traffic insights through Umami.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Local Content Analytics
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Database-backed metrics that work without external analytics.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {stats.map((stat) => (
            <AnalyticsStatCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      <ViewsTimeline timeline={data.timeline} />

      <div className="grid gap-6 xl:grid-cols-2">
        <RankingChart items={data.topPosts} title="Top Posts Chart" />
        <RankingChart items={data.topProjects} title="Top Projects Chart" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <TopContentList
          editPath="posts"
          items={data.topPosts}
          publicPath="blog"
          title="Top Posts"
        />
        <TopContentList
          editPath="projects"
          items={data.topProjects}
          publicPath="projects"
          title="Top Projects"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Views</CardTitle>
          <CardDescription>
            Latest privacy-friendly local content view events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentViews.length === 0 ? (
            <EmptyState
              icon={<EyeIcon />}
              title="No view events yet"
              description="Events appear after published posts or projects are viewed."
            />
          ) : (
            <div className="divide-y rounded-2xl border bg-background/40">
              {data.recentViews.map((event) => (
                <div
                  key={event.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      /{event.type === "post" ? "blog" : "projects"}/
                      {event.slug}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.type} view
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <UmamiPanel />
    </div>
  );
}
