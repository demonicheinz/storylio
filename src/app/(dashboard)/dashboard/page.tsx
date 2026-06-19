import {
  ArrowRightIcon,
  ArticleIcon,
  ChatCircleIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  FolderOpenIcon,
  ImageIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { cn, formatDate } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  iconClassName: string;
};

type RecentItem = {
  id: string;
  title: string;
  slug: string;
  type: "Post" | "Project";
  status: "Published" | "Draft";
  href: string;
  publicHref: string;
  image: string | null;
  views: number;
  date: Date;
};

type HealthItem = {
  label: string;
  value: number;
  description: string;
  tone: "success" | "warning" | "danger";
  href: string;
};

function getHealthTone(value: number): HealthItem["tone"] {
  if (value === 0) return "success";
  if (value > 10) return "danger";
  return "warning";
}

async function getOverviewData() {
  const [
    totalPosts,
    publishedPosts,
    draftPosts,
    missingPostCovers,
    postViews,
    totalProjects,
    publishedProjects,
    draftProjects,
    featuredProjects,
    missingProjectCovers,
    projectViews,
    totalGalleryItems,
    visibleGalleryItems,
    hiddenGalleryItems,
    totalTestimonials,
    visibleTestimonials,
    recentPosts,
    recentProjects,
  ] = await Promise.all([
    db.post.count(),
    db.post.count({ where: { status: "PUBLISHED" } }),
    db.post.count({ where: { status: "DRAFT" } }),
    db.post.count({ where: { coverImage: null } }),
    db.post.aggregate({ _sum: { viewCount: true } }),
    db.project.count(),
    db.project.count({ where: { status: ProjectStatus.PUBLISHED } }),
    db.project.count({ where: { status: ProjectStatus.DRAFT } }),
    db.project.count({ where: { isFeatured: true } }),
    db.project.count({
      where: {
        coverImage: null,
        thumbnailImageUrl: null,
      },
    }),
    db.project.aggregate({ _sum: { viewCount: true } }),
    db.galleryItem.count(),
    db.galleryItem.count({ where: { isVisible: true } }),
    db.galleryItem.count({ where: { isVisible: false } }),
    db.testimonial.count(),
    db.testimonial.count({ where: { isVisible: true } }),
    db.post.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        coverImage: true,
        viewCount: true,
        updatedAt: true,
      },
    }),
    db.project.findMany({
      take: 5,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        coverImage: true,
        thumbnailImageUrl: true,
        viewCount: true,
        updatedAt: true,
      },
    }),
  ]);

  const recentPostItems: RecentItem[] = recentPosts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    type: "Post" as const,
    status:
      post.status === "PUBLISHED" ? ("Published" as const) : ("Draft" as const),
    href: `/dashboard/posts/${post.id}/edit`,
    publicHref: `/blog/${post.slug}`,
    image: post.coverImage,
    views: post.status === "PUBLISHED" ? post.viewCount : 0,
    date: post.updatedAt,
  }));
  const recentProjectItems: RecentItem[] = recentProjects.map((project) => ({
    id: project.id,
    title: project.title,
    slug: project.slug,
    type: "Project" as const,
    status:
      project.status === ProjectStatus.PUBLISHED
        ? ("Published" as const)
        : ("Draft" as const),
    href: `/dashboard/projects/${project.id}/edit`,
    publicHref: `/projects/${project.slug}`,
    image: project.thumbnailImageUrl ?? project.coverImage,
    views: project.status === ProjectStatus.PUBLISHED ? project.viewCount : 0,
    date: project.updatedAt,
  }));

  return {
    stats: {
      posts: {
        total: totalPosts,
        published: publishedPosts,
      },
      projects: {
        total: totalProjects,
        published: publishedProjects,
        featured: featuredProjects,
      },
      gallery: {
        total: totalGalleryItems,
        visible: visibleGalleryItems,
      },
      views:
        (postViews._sum.viewCount ?? 0) + (projectViews._sum.viewCount ?? 0),
      testimonials: {
        total: totalTestimonials,
        visible: visibleTestimonials,
      },
    },
    healthItems: [
      {
        label: "Draft posts",
        value: draftPosts,
        description: "Waiting to publish",
        tone: getHealthTone(draftPosts),
        href: "/dashboard/posts",
      },
      {
        label: "Draft projects",
        value: draftProjects,
        description: "Portfolio drafts",
        tone: getHealthTone(draftProjects),
        href: "/dashboard/projects",
      },
      {
        label: "Hidden gallery",
        value: hiddenGalleryItems,
        description: "Not shown publicly",
        tone: getHealthTone(hiddenGalleryItems),
        href: "/dashboard/gallery",
      },
      {
        label: "Missing covers",
        value: missingPostCovers + missingProjectCovers,
        description: "Posts/projects without media",
        tone: getHealthTone(missingPostCovers + missingProjectCovers),
        href: "/dashboard/media",
      },
    ] satisfies HealthItem[],
    recentPostItems,
    recentProjectItems,
  };
}

function DashboardHomeFallback() {
  return (
    <div className="flex min-w-0 flex-col gap-5">
      <OverviewHeader />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {["Posts", "Projects", "Gallery", "Views"].map((label) => (
          <Card
            key={label}
            className="min-w-0 border-border/70 bg-card/55 py-4 shadow-sm"
          >
            <CardContent className="flex items-center gap-3 px-4">
              <div className="size-10 rounded-2xl bg-muted/50" />
              <div className="min-w-0 flex-1">
                <div className="h-5 w-12 rounded-md bg-muted/60" />
                <div className="mt-2 h-3 w-20 rounded-md bg-muted/40" />
                <div className="mt-1 h-2.5 w-16 rounded-md bg-muted/30" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OverviewHeader() {
  return (
    <div className="min-w-0">
      <div className="min-w-0">
        <h1 className="font-heading text-3xl font-bold">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          A focused snapshot of your content, recent updates, and quick actions.
        </p>
      </div>
    </div>
  );
}

function OverviewStatCard({
  label,
  value,
  description,
  icon,
  iconClassName,
}: StatCardProps) {
  return (
    <Card className="min-w-0 border-border/70 bg-card/55 py-4 shadow-sm">
      <CardContent className="flex items-center gap-3 px-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            iconClassName,
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading text-xl font-bold">{value}</p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: RecentItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        status === "Published"
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "Published" ? "bg-emerald-300" : "bg-amber-300",
        )}
      />
      {status}
    </span>
  );
}

function RecentActions({ item }: { item: RecentItem }) {
  const label = item.type.toLowerCase();
  const canPreview = item.status === "Published";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${item.title}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{item.type}</DropdownMenuLabel>
        {canPreview && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={item.publicHref} target="_blank">
              <EyeIcon data-icon="inline-start" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={item.href}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit {label}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link
            href={`/dashboard/${item.type === "Post" ? "posts" : "projects"}`}
          >
            View all
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RecentThumbnail({ item }: { item: RecentItem }) {
  return (
    <div className="relative hidden aspect-video w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/30 text-muted-foreground sm:flex">
      {item.image ? (
        <Image
          src={item.image}
          alt=""
          fill
          className="object-cover"
          sizes="80px"
        />
      ) : item.type === "Post" ? (
        <ArticleIcon className="size-5" />
      ) : (
        <FolderOpenIcon className="size-5" />
      )}
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <CardTitle className="font-heading">{title}</CardTitle>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function RecentItemsCard({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  items,
  emptyLabel,
}: {
  title: string;
  subtitle: string;
  viewAllHref: string;
  viewAllLabel: string;
  items: RecentItem[];
  emptyLabel: string;
}) {
  return (
    <Card className="min-w-0 border-border/70 bg-card/55">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <SectionHeading title={title} subtitle={subtitle} />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="shrink-0 text-brand-soft hover:text-brand-soft"
          >
            <Link href={viewAllHref}>
              {viewAllLabel}
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-background/25 p-6 text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-2xl border border-border/60 bg-background/30 p-3 transition-colors hover:border-brand-soft/40 hover:bg-background/45 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto]"
              >
                <RecentThumbnail item={item} />
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="block truncate font-heading text-sm font-semibold hover:text-brand-soft"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {formatDate(item.date)} ·{" "}
                    {item.views.toLocaleString("en-US")} views
                  </p>
                </div>
                <StatusBadge status={item.status} />
                <RecentActions item={item} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const actions = [
    {
      label: "Write a post",
      href: "/dashboard/posts/new",
      icon: <ArticleIcon data-icon="inline-start" />,
    },
    {
      label: "Add a project",
      href: "/dashboard/projects/new",
      icon: <FolderOpenIcon data-icon="inline-start" />,
    },
    {
      label: "Update gallery",
      href: "/dashboard/gallery",
      icon: <ImageIcon data-icon="inline-start" />,
    },
    {
      label: "Edit home",
      href: "/dashboard/home",
      icon: <ChatCircleIcon data-icon="inline-start" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap">
      {actions.map((action, index) => (
        <Button
          key={action.href}
          asChild
          variant={index === 0 ? "default" : "outline"}
          className="rounded-2xl"
        >
          <Link href={action.href}>
            {action.icon}
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}

function ContentHealth({ items }: { items: HealthItem[] }) {
  return (
    <Card className="min-w-0 border-border/70 bg-card/55">
      <CardHeader>
        <SectionHeading
          title="Content Health"
          subtitle="Lightweight checks for items that may need attention."
        />
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-border/60 bg-background/30 p-4 transition-colors hover:border-brand-soft/40 hover:bg-background/45"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium">{item.label}</span>
                <span
                  className={cn(
                    "font-heading text-lg font-bold",
                    item.tone === "success" && "text-emerald-300",
                    item.tone === "warning" && "text-amber-300",
                    item.tone === "danger" && "text-rose-300",
                  )}
                >
                  {item.value}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardHomePage() {
  return (
    <Suspense fallback={<DashboardHomeFallback />}>
      <DashboardHomeContent />
    </Suspense>
  );
}

async function DashboardHomeContent() {
  await connection();

  const { stats, healthItems, recentPostItems, recentProjectItems } =
    await getOverviewData();

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <OverviewHeader />
      <QuickActions />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <OverviewStatCard
          label="Total Posts"
          value={stats.posts.total}
          description={`${stats.posts.published} published`}
          icon={<ArticleIcon className="size-5" />}
          iconClassName="bg-sky-500/12 text-sky-300"
        />
        <OverviewStatCard
          label="Total Projects"
          value={stats.projects.total}
          description={`${stats.projects.published} published`}
          icon={<FolderOpenIcon className="size-5" />}
          iconClassName="bg-violet-500/12 text-violet-300"
        />
        <OverviewStatCard
          label="Gallery Items"
          value={stats.gallery.total}
          description={`${stats.gallery.visible} visible`}
          icon={<ImageIcon className="size-5" />}
          iconClassName="bg-amber-500/12 text-amber-300"
        />
        <OverviewStatCard
          label="Total Views"
          value={stats.views.toLocaleString("en-US")}
          description="Posts + projects"
          icon={<EyeIcon className="size-5" />}
          iconClassName="bg-emerald-500/12 text-emerald-300"
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-2">
        <RecentItemsCard
          title="Recent Posts"
          subtitle="Your latest blog articles."
          viewAllHref="/dashboard/posts"
          viewAllLabel="View all posts"
          items={recentPostItems}
          emptyLabel="No posts yet."
        />
        <RecentItemsCard
          title="Recent Projects"
          subtitle="Your latest portfolio items."
          viewAllHref="/dashboard/projects"
          viewAllLabel="View all projects"
          items={recentProjectItems}
          emptyLabel="No projects yet."
        />
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <ContentHealth items={healthItems} />
        <Card className="min-w-0 border-border/70 bg-card/55">
          <CardHeader>
            <SectionHeading
              title="Home Signals"
              subtitle="Small public-facing content indicators."
            />
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-sm text-muted-foreground">
                Visible testimonials
              </span>
              <span className="font-heading text-lg font-bold">
                {stats.testimonials.visible}/{stats.testimonials.total}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/30 p-4">
              <span className="text-sm text-muted-foreground">
                Featured projects
              </span>
              <span className="font-heading text-lg font-bold">
                {stats.projects.featured}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
