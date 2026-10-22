import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects] = await Promise.all([
    db.query.post.findMany({
      where: (table) =>
        and(
          eq(table.status, PostStatus.PUBLISHED),
          or(isNull(table.publishedAt), lte(table.publishedAt, new Date())),
        ),
      columns: { slug: true, publishedAt: true, updatedAt: true },
      orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
    }),
    db.query.project.findMany({
      where: (table) => eq(table.status, ProjectStatus.PUBLISHED),
      columns: { slug: true, updatedAt: true },
      orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    }),
  ]);

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts.map((post) => ({
      url: `${siteUrl}/blog/${post.slug}`,
      lastModified: post.publishedAt ?? post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
