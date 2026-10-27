import { and, asc, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { ITEMS_PER_PAGE } from "@/lib/archive-pagination";
import { db } from "@/lib/db";
import { PostStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";
import { post, postToTag, tag } from "@/lib/db/schema";
import { HOME_NOTES_TAG, homePostWhere } from "@/lib/home-content";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

export async function getWritingFacets() {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.posts);
  const rows = await db.query.post.findMany({
    where: and(
      eq(post.status, PostStatus.PUBLISHED),
      or(isNull(post.publishedAt), lte(post.publishedAt, new Date())),
    ),
    columns: { id: true, slug: true },
    with: { tags: { columns: {}, with: { tag: { columns: { name: true } } } } },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    tags: row.tags.map(({ tag }) => tag.name),
  }));
}

export async function getWritingRows(
  kind: "writing" | "notes",
  selectedTag: string | undefined,
  page: number,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.posts);
  const noteIds = db
    .select({ postId: postToTag.postId })
    .from(postToTag)
    .innerJoin(tag, eq(postToTag.tagId, tag.id))
    .where(eq(tag.name, HOME_NOTES_TAG));
  const matchingIds = selectedTag
    ? db
        .select({ postId: postToTag.postId })
        .from(postToTag)
        .innerJoin(tag, eq(postToTag.tagId, tag.id))
        .where(eq(tag.name, selectedTag))
    : undefined;
  const rows = await db.query.post.findMany({
    where: and(
      homePostWhere(post, kind, new Date(), noteIds),
      matchingIds ? inArray(post.id, matchingIds) : undefined,
    ),
    columns: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
      viewCount: true,
    },
    with: {
      tags: {
        columns: {},
        with: { tag: { columns: { id: true, name: true } } },
        orderBy: orderPostTagsByName,
      },
    },
    orderBy: [desc(post.publishedAt), desc(post.createdAt), asc(post.id)],
    limit: ITEMS_PER_PAGE,
    offset: (page - 1) * ITEMS_PER_PAGE,
  });
  return rows.map(flattenPostTags);
}
