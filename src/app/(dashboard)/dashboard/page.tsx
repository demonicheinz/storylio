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
import { dashboardStyles } from "@/features/dashboard/shared/styles";
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
    <div className={dashboardStyles.page}>
      <OverviewHeader />
      <div className={dashboardStyles.statGrid}>
        {["Posts", "Projects", "Gallery", "Views"].map((label) => (
          <Card key={label} className={dashboardStyles.statCard}>
            <CardContent className={dashboardStyles.statContent}>
              <div className="bg-muted/50 rounded-2xl size-10" />
              <div className="flex-1 min-w-0">
                <div className="bg-muted/60 rounded-md w-12 h-5" />
                <div className="bg-muted/40 mt-2 rounded-md w-20 h-3" />
                <div className="bg-muted/30 mt-1 rounded-md w-16 h-2.5" />
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
        <h1 className="font-heading font-bold text-3xl">Overview</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
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
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-bold text-xl">{value}</p>
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
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium text-xs",
        status === "Published"
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300",
      )}
    >
      <span
        className={cn(
          "rounded-full size-1.5",
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
          className="bg-background/70 hover:bg-background backdrop-blur rounded-xl size-8 text-foreground"
          aria-label={`Open actions for ${item.title}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{item.type}</DropdownMenuLabel>
        {canPreview && (
          <DropdownMenuItem asChild>
            <Link href={item.publicHref} target="_blank">
              <EyeIcon data-icon="inline-start" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={item.href}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit {label}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
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
    <div className="hidden relative sm:flex justify-center items-center bg-muted/30 border border-border/60 rounded-xl w-20 aspect-video overflow-hidden text-muted-foreground shrink-0">
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
      <p className="text-muted-foreground text-sm">{subtitle}</p>
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
    <Card className={dashboardStyles.surface}>
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <SectionHeading title={title} subtitle={subtitle} />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-brand-soft hover:text-brand-soft shrink-0"
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
          <div className="bg-background/30 p-6 border border-border/70 border-dashed rounded-2xl text-muted-foreground text-sm">
            {emptyLabel}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="items-center gap-3 grid grid-cols-[minmax(0,1fr)_auto_auto] sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] bg-background/30 hover:bg-background/40 p-3 border border-border/60 hover:border-brand-soft/40 rounded-2xl min-w-0 transition-colors"
              >
                <RecentThumbnail item={item} />
                <div className="min-w-0">
                  <Link
                    href={item.href}
                    className="block font-heading font-semibold hover:text-brand-soft text-sm truncate"
                  >
                    {item.title}
                  </Link>
                  <p className="mt-1 text-muted-foreground text-xs truncate">
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
    <div className="md:flex md:flex-wrap gap-2 grid grid-cols-2">
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
    <Card className={dashboardStyles.surface}>
      <CardHeader>
        <SectionHeading
          title="Content Health"
          subtitle="Lightweight checks for items that may need attention."
        />
      </CardHeader>
      <CardContent>
        <div className="gap-3 grid sm:grid-cols-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-background/30 hover:bg-background/40 p-4 border border-border/60 hover:border-brand-soft/40 rounded-2xl transition-colors"
            >
              <div className="flex justify-between items-center gap-3">
                <span className="font-medium text-sm">{item.label}</span>
                <span
                  className={cn(
                    "font-heading font-bold text-lg",
                    item.tone === "success" && "text-emerald-300",
                    item.tone === "warning" && "text-amber-300",
                    item.tone === "danger" && "text-rose-300",
                  )}
                >
                  {item.value}
                </span>
              </div>
              <p className="mt-1 text-muted-foreground text-xs">
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
    <div className={dashboardStyles.page}>
      <OverviewHeader />
      <QuickActions />

      <div className={dashboardStyles.statGrid}>
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

      <div className="gap-5 grid xl:grid-cols-2 min-w-0">
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

      <div className="gap-5 grid xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] min-w-0">
        <ContentHealth items={healthItems} />
        <Card className={dashboardStyles.surface}>
          <CardHeader>
            <SectionHeading
              title="Home Signals"
              subtitle="Small public-facing content indicators."
            />
          </CardHeader>
          <CardContent className="gap-3 grid">
            <div
              className={cn(
                dashboardStyles.nestedPanel,
                "flex items-center justify-between",
              )}
            >
              <span className="text-muted-foreground text-sm">
                Visible testimonials
              </span>
              <span className="font-heading font-bold text-lg">
                {stats.testimonials.visible}/{stats.testimonials.total}
              </span>
            </div>
            <div
              className={cn(
                dashboardStyles.nestedPanel,
                "flex items-center justify-between",
              )}
            >
              <span className="text-muted-foreground text-sm">
                Featured projects
              </span>
              <span className="font-heading font-bold text-lg">
                {stats.projects.featured}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
