import { and, asc, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { MetadataRoute } from "next";
import { resolveAvatarSource } from "@/lib/avatar";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";
import { HOME_NOTES_TAG } from "@/lib/home-content";
import { SITE_URL as siteUrl } from "@/lib/site";

function imageUrls(values: (string | null | undefined)[]) {
  const urls = values.flatMap((value) => {
    if (!value?.trim()) return [];
    try {
      const url = new URL(value, `${siteUrl}/`);
      return url.protocol === "https:" || url.protocol === "http:"
        ? [url.href]
        : [];
    } catch {
      return [];
    }
  });
  // Next 16.4.2 writes image URLs into XML without escaping their query separators.
  return [...new Set(urls)].map((url) => url.replaceAll("&", "&amp;"));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, projects, gallery, owner] = await Promise.all([
    db.query.post.findMany({
      where: (table) =>
        and(
          eq(table.status, PostStatus.PUBLISHED),
          or(isNull(table.publishedAt), lte(table.publishedAt, new Date())),
        ),
      columns: {
        slug: true,
        publishedAt: true,
        updatedAt: true,
        coverImage: true,
      },
      with: {
        tags: { columns: {}, with: { tag: { columns: { name: true } } } },
      },
      orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
    }),
    db.query.project.findMany({
      where: (table) => eq(table.status, ProjectStatus.PUBLISHED),
      columns: {
        slug: true,
        updatedAt: true,
        coverImage: true,
        thumbnailImageUrl: true,
      },
      with: {
        structuredScreenshots: {
          columns: { imageUrl: true },
          orderBy: (table) => [asc(table.order), asc(table.createdAt)],
        },
      },
      orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    }),
    db.query.galleryItem.findMany({
      where: (table) => eq(table.isVisible, true),
      columns: { imageUrl: true },
      orderBy: (table) => [asc(table.order), desc(table.createdAt)],
    }),
    db.query.user.findFirst({
      columns: { image: true },
      orderBy: (table) => [asc(table.createdAt)],
    }),
  ]);

  return [
    {
      url: siteUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/about`,
      images: imageUrls([resolveAvatarSource(owner?.image)]),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/projects`,
      images: imageUrls(
        projects.map(
          (project) => project.thumbnailImageUrl ?? project.coverImage,
        ),
      ),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      images: imageUrls([
        project.coverImage,
        ...project.structuredScreenshots.map((image) => image.imageUrl),
      ]),
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: `${siteUrl}/blog`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...posts
      .filter(
        (post) => !post.tags.some(({ tag }) => tag.name === HOME_NOTES_TAG),
      )
      .map((post) => ({
        url: `${siteUrl}/blog/${post.slug}`,
        images: imageUrls([post.coverImage]),
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    {
      url: `${siteUrl}/gallery`,
      images: imageUrls(gallery.map((image) => image.imageUrl)),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
}
