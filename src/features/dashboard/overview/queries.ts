import { and, desc, eq, isNull, lte, or, sql, sum } from "drizzle-orm";
import { db } from "@/lib/db";
import { galleryItem, post, project } from "@/lib/db/schema";
import { HOME_NOTES_TAG } from "@/lib/home-content";

export type RecentDashboardItem = {
  id: string;
  title: string;
  kind: "Article" | "Note" | "Project";
  status: "Published" | "Draft" | "Scheduled";
  href: string;
  publicHref: string;
  image: string | null;
  views: number;
  updatedAt: Date;
};

export async function getDashboardOverview() {
  const now = new Date();
  const livePost = and(
    eq(post.status, "PUBLISHED"),
    or(isNull(post.publishedAt), lte(post.publishedAt, now)),
  );
  const [posts, projects, gallery, recentPosts, recentProjects] =
    await Promise.all([
      db
        .select({
          total: sql<number>`count(*)::int`,
          published: sql<number>`count(*) filter (where ${livePost})::int`,
          drafts: sql<number>`count(*) filter (where ${post.status} = 'DRAFT')::int`,
          views: sum(post.viewCount).mapWith(Number),
        })
        .from(post)
        .then(([row]) => row),
      db
        .select({
          total: sql<number>`count(*)::int`,
          published: sql<number>`count(*) filter (where ${project.status} = 'PUBLISHED')::int`,
          drafts: sql<number>`count(*) filter (where ${project.status} = 'DRAFT')::int`,
          featured: sql<number>`count(*) filter (where ${project.status} = 'PUBLISHED' and ${project.isFeatured})::int`,
          views: sum(project.viewCount).mapWith(Number),
        })
        .from(project)
        .then(([row]) => row),
      db
        .select({
          total: sql<number>`count(*)::int`,
          visible: sql<number>`count(*) filter (where ${galleryItem.isVisible})::int`,
          hidden: sql<number>`count(*) filter (where not ${galleryItem.isVisible})::int`,
        })
        .from(galleryItem)
        .then(([row]) => row),
      db.query.post.findMany({
        limit: 5,
        orderBy: [desc(post.updatedAt), desc(post.id)],
        columns: {
          id: true,
          title: true,
          slug: true,
          status: true,
          coverImage: true,
          viewCount: true,
          updatedAt: true,
          publishedAt: true,
        },
        with: {
          tags: { columns: {}, with: { tag: { columns: { name: true } } } },
        },
      }),
      db.query.project.findMany({
        limit: 5,
        orderBy: [desc(project.updatedAt), desc(project.id)],
        columns: {
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
  const writing: RecentDashboardItem[] = recentPosts.map((item) => {
    const note = item.tags.some(({ tag }) => tag.name === HOME_NOTES_TAG);
    const status =
      item.status === "DRAFT"
        ? "Draft"
        : item.publishedAt && item.publishedAt > now
          ? "Scheduled"
          : "Published";
    return {
      id: item.id,
      title: item.title,
      kind: note ? "Note" : "Article",
      status,
      href: `/dashboard/posts/${item.id}/edit`,
      publicHref: note
        ? "/blog?" +
          new URLSearchParams({ tag: HOME_NOTES_TAG, note: item.slug })
        : `/blog/${item.slug}`,
      image: item.coverImage,
      views: status === "Published" ? item.viewCount : 0,
      updatedAt: item.updatedAt,
    };
  });
  const work: RecentDashboardItem[] = recentProjects.map((item) => ({
    id: item.id,
    title: item.title,
    kind: "Project",
    status: item.status === "PUBLISHED" ? "Published" : "Draft",
    href: `/dashboard/projects/${item.id}/edit`,
    publicHref: `/projects/${item.slug}`,
    image: item.thumbnailImageUrl ?? item.coverImage,
    views: item.status === "PUBLISHED" ? item.viewCount : 0,
    updatedAt: item.updatedAt,
  }));
  return {
    posts,
    projects,
    gallery,
    views: (posts.views ?? 0) + (projects.views ?? 0),
    writing,
    work,
  };
}
