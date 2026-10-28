import { Suspense } from "react";
import DashboardLayout from "@/app/(dashboard)/layout";
import { AboutContentForm } from "@/features/dashboard/about/components/content-form";
import { AboutStructuredManager } from "@/features/dashboard/about/components/structured-manager";
import { GalleryManager } from "@/features/dashboard/gallery/components/gallery-item-form";
import { HomeContentManager } from "@/features/dashboard/home/components/home-section-form";
import { MediaLibraryClient } from "@/features/dashboard/media/components/media-client";
import { DashboardOverview } from "@/features/dashboard/overview/overview-view";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";
import { PostsManager } from "@/features/dashboard/posts/components/posts-manager";
import { ProjectEditor } from "@/features/dashboard/projects/components/project-editor";
import { ProjectsManager } from "@/features/dashboard/projects/components/projects-manager";
import { SettingsManager } from "@/features/dashboard/settings/components/profile-settings-form";

const now = new Date("2026-10-28T00:00:00Z");
const data = {
  posts: { total: 7, published: 6, drafts: 1, views: 280 },
  projects: { total: 5, published: 3, drafts: 2, featured: 2, views: 160 },
  gallery: { total: 10, visible: 9, hidden: 1 },
  views: 440,
  writing: [
    {
      id: "article",
      title:
        "Building Storylio with server-first pages and a calmer publishing workflow",
      kind: "Article" as const,
      status: "Published" as const,
      href: "/dashboard/posts/article/edit",
      publicHref: "/blog/article",
      image: null,
      views: 165,
      updatedAt: now,
    },
    {
      id: "note",
      title: "Giving the stack one row",
      kind: "Note" as const,
      status: "Published" as const,
      href: "/dashboard/posts/note/edit",
      publicHref: "/blog?tag=notes&note=one-row",
      image: null,
      views: 14,
      updatedAt: now,
    },
    {
      id: "draft",
      title: "A longer draft title that stays readable on a narrow screen",
      kind: "Article" as const,
      status: "Draft" as const,
      href: "/dashboard/posts/draft/edit",
      publicHref: "/blog/draft",
      image: null,
      views: 0,
      updatedAt: now,
    },
  ],
  work: [
    {
      id: "project",
      title: "Storylio — a portfolio and publishing system",
      kind: "Project" as const,
      status: "Published" as const,
      href: "/dashboard/projects/project/edit",
      publicHref: "/projects/storylio",
      image: null,
      views: 81,
      updatedAt: now,
    },
    {
      id: "draft-project",
      title: "Nebula Commerce",
      kind: "Project" as const,
      status: "Draft" as const,
      href: "/dashboard/projects/draft-project/edit",
      publicHref: "/projects/nebula",
      image: null,
      views: 0,
      updatedAt: now,
    },
  ],
};

export default function DashboardFixture(props: {
  searchParams: Promise<{ view?: string }>;
}) {
  return (
    <DashboardLayout>
      <p className="mb-4 text-muted-foreground text-xs">
        Local preview · example content
      </p>
      <Suspense fallback={<p>Loading fixture…</p>}>
        <FixtureContent {...props} />
      </Suspense>
    </DashboardLayout>
  );
}

async function FixtureContent({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const view = (await searchParams).view;
  const posts = data.writing.map((item) => ({
    id: item.id,
    title: item.title,
    slug: item.id,
    status:
      item.status === "Draft" ? ("DRAFT" as const) : ("PUBLISHED" as const),
    coverImage: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    publishedAt: null,
    viewCount: item.views,
    tags: item.kind === "Note" ? [{ name: "notes" }] : [],
  }));
  const projects = data.work.map((item, index) => ({
    id: item.id,
    title: item.title,
    slug: item.id,
    status:
      item.status === "Draft" ? ("DRAFT" as const) : ("PUBLISHED" as const),
    description: null,
    coverImage: null,
    thumbnailImageUrl: null,
    isFeatured: index === 0,
    techStack: [],
    order: index,
    createdAt: now,
    updatedAt: now,
  }));
  const photos = [
    {
      id: "hidden-photo",
      imageUrl: "/images/auth-earth.avif",
      caption: "Hidden example",
      category: null,
      description: null,
      altText: "Earth",
      width: 2728,
      height: 1536,
      size: 45258,
      aspectRatio: 2728 / 1536,
      blurDataUrl: null,
      isVisible: false,
      order: 0,
      createdAt: now.toISOString(),
    },
    {
      id: "visible-photo",
      imageUrl: "/images/auth-earth.avif",
      caption: "Visible example",
      category: null,
      description: null,
      altText: "Earth",
      width: 2728,
      height: 1536,
      size: 45258,
      aspectRatio: 2728 / 1536,
      blurDataUrl: null,
      isVisible: true,
      order: 1,
      createdAt: now.toISOString(),
    },
  ];
  if (view === "post-editor") return <PostEditor mode="create" />;
  if (view === "project-editor") return <ProjectEditor mode="create" />;
  if (view === "home")
    return (
      <>
        <h1 className="mb-6">Home</h1>
        <HomeContentManager
          headline="Example headline for layout review"
          phases={[]}
          logos={[]}
          testimonials={[]}
        />
      </>
    );
  if (view === "about")
    return (
      <>
        <h1 className="mb-6">About</h1>
        <AboutContentForm />
      </>
    );
  if (view === "about-structured")
    return (
      <>
        <h1 className="mb-6">About</h1>
        <AboutStructuredManager
          section="experience"
          data={{ experiences: [], education: [], categories: [] }}
        />
      </>
    );
  if (view === "settings")
    return (
      <>
        <h1 className="mb-6">Settings</h1>
        <SettingsManager
          profile={{
            id: "owner",
            email: "owner@example.test",
            name: "Example owner",
            image: null,
            tagline: "Example role",
            bio: "Example profile text for responsive review.",
            github: null,
            instagram: null,
            twitter: null,
            websiteUrl: null,
            publicEmail: null,
          }}
          linkedAccounts={[]}
        />
      </>
    );
  if (view === "media")
    return (
      <MediaLibraryClient
        initialMedia={[
          {
            id: "earth",
            url: "/images/auth-earth.avif",
            publicId: "example-earth",
            filename: "example-earth.avif",
            size: 45258,
            format: "avif",
            width: 2728,
            height: 1536,
            aspectRatio: 2728 / 1536,
            blurDataUrl: null,
            createdAt: now,
          },
        ]}
      />
    );
  return (
    <>
      {view === "posts" ? (
        <PostsManager posts={posts} />
      ) : view === "projects" ? (
        <ProjectsManager projects={projects} />
      ) : view === "gallery" ? (
        <GalleryManager items={photos} />
      ) : (
        <DashboardOverview data={data} />
      )}
    </>
  );
}
