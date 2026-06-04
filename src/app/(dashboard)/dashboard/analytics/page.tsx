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
import { PostStatus, ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

type AnalyticsStatCardProps = {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
};

const umamiShareUrl = process.env.NEXT_PUBLIC_UMAMI_SHARE_URL?.trim();
const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID?.trim();

async function getAnalyticsData() {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    totalProjects,
    publishedProjects,
    galleryItems,
    testimonials,
    postViews,
    topPosts,
    recentProjects,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: PostStatus.PUBLISHED } }),
    db.post.count({ where: { status: PostStatus.DRAFT } }),
    db.project.count(),
    db.project.count({ where: { status: ProjectStatus.PUBLISHED } }),
    db.galleryItem.count(),
    db.testimonial.count(),
    db.post.aggregate({
      _sum: {
        viewCount: true,
      },
    }),
    db.post.findMany({
      orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        viewCount: true,
        publishedAt: true,
      },
    }),
    db.project.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    galleryItems,
    postViews: postViews._sum.viewCount ?? 0,
    publishedPosts,
    publishedProjects,
    recentProjects,
    testimonials,
    topPosts,
    totalPosts,
    totalProjects,
    draftPosts,
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

  if (umamiWebsiteId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Traffic Analytics</CardTitle>
          <CardDescription>
            Umami website ID is configured, but an embeddable share URL is
            needed for the dashboard iframe.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed bg-background/40 p-6">
            <p className="font-medium">Content analytics from local database</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Add `NEXT_PUBLIC_UMAMI_SHARE_URL` to enable the embedded traffic
              analytics dashboard. Until then, this page shows database-backed
              content performance.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Traffic Analytics</CardTitle>
        <CardDescription>Umami embed is not configured yet.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-dashed bg-background/40 p-6">
          <p className="font-medium">Content analytics from local database</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure `NEXT_PUBLIC_UMAMI_SHARE_URL` for traffic analytics, or
            `NEXT_PUBLIC_UMAMI_WEBSITE_ID` plus a share URL when the Umami
            dashboard is ready.
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
      description: "Posts still hidden from public readers.",
      icon: <ArticleIcon />,
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
      description: "Projects currently visible on the public portfolio.",
      icon: <FolderIcon />,
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
    {
      label: "Post views",
      value: data.postViews,
      description: "Total views counted from local Post.viewCount.",
      icon: <EyeIcon />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-bold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          Summarize content performance from the local database and connect
          traffic insights through Umami when configured.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AnalyticsStatCard key={stat.label} {...stat} />
        ))}
      </div>

      <UmamiPanel />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Posts by Views</CardTitle>
            <CardDescription>
              Top 5 blog posts ordered by local `Post.viewCount`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.topPosts.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center">
                <ChartLineIcon className="size-10 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No posts yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Publish posts and collect views to populate this table.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data.topPosts.map((post) => {
                  const isPublished = post.status === PostStatus.PUBLISHED;

                  return (
                    <div
                      key={post.id}
                      className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-heading text-base font-semibold">
                            {post.title}
                          </h2>
                          <Badge
                            variant={isPublished ? "default" : "secondary"}
                          >
                            {isPublished ? "published" : "draft"}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          /blog/{post.slug}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {post.viewCount.toLocaleString("en-US")} views
                          </span>
                          {post.publishedAt && (
                            <span>
                              Published {formatDate(post.publishedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        {isPublished && (
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/blog/${post.slug}`} target="_blank">
                              View
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/posts/${post.id}/edit`}>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Project view tracking is not in the schema, so this shows the
              latest 5 updated projects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.recentProjects.length === 0 ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed text-center">
                <FolderIcon className="size-10 text-muted-foreground/50" />
                <div>
                  <p className="font-medium">No projects yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add portfolio projects to see recent project activity.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {data.recentProjects.map((project) => {
                  const isPublished =
                    project.status === ProjectStatus.PUBLISHED;

                  return (
                    <div
                      key={project.id}
                      className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate font-heading text-base font-semibold">
                            {project.title}
                          </h2>
                          <Badge
                            variant={isPublished ? "default" : "secondary"}
                          >
                            {isPublished ? "published" : "draft"}
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                          /projects/{project.slug}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span>Updated {formatDate(project.updatedAt)}</span>
                          <span>Created {formatDate(project.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        {isPublished && (
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={`/projects/${project.slug}`}
                              target="_blank"
                            >
                              View
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="secondary">
                          <Link href={`/dashboard/projects/${project.id}/edit`}>
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
      </div>
    </div>
  );
}
