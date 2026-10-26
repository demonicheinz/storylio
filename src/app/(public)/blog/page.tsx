import { and, desc, eq, inArray, isNull, lte, or } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import styles from "@/components/public/public-page.module.css";
import { BlogFilters } from "@/components/public/sections/blog/blog-filters";
import { BlogHero } from "@/components/public/sections/blog/blog-hero";
import { BlogReveal } from "@/components/public/sections/blog/blog-reveal";
import { EmptyPosts } from "@/components/public/sections/blog/empty-posts";
import { FeaturedPost } from "@/components/public/sections/blog/featured-post";
import { PostList } from "@/components/public/sections/blog/post-list";
import { db } from "@/lib/db";
import { PostStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";
import { post, postToTag, tag } from "@/lib/db/schema";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
  title: "Writing — Storylio",
  description:
    "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
  openGraph: {
    title: "Writing — Storylio",
    description:
      "Read notes on web development, interface craft, and product building by Heinz.",
    type: "website",
    images: ["/og?title=Writing&type=page"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing — Storylio",
    description:
      "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
    images: ["/og?title=Writing&type=page"],
  },
};

function getSelectedTag(value: string | string[] | undefined) {
  const tag = Array.isArray(value) ? value[0] : value;

  return tag?.trim() || undefined;
}

function formatBlogSummary(postsCount: number, selectedTag?: string) {
  const noun = postsCount === 1 ? "article" : "articles";

  if (selectedTag) {
    return `Showing ${postsCount} ${noun} tagged ${selectedTag}`;
  }

  return `Showing ${postsCount} ${noun} across all topics`;
}

async function getBlogData(selectedTag?: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.posts);

  const now = new Date();
  const publishedWhere = and(
    eq(post.status, PostStatus.PUBLISHED),
    or(isNull(post.publishedAt), lte(post.publishedAt, now)),
  );

  const [posts, allPublishedPosts] = await Promise.all([
    db.query.post
      .findMany({
        where: (table) =>
          and(
            publishedWhere,
            selectedTag
              ? inArray(
                  table.id,
                  db
                    .select({ postId: postToTag.postId })
                    .from(postToTag)
                    .innerJoin(tag, eq(postToTag.tagId, tag.id))
                    .where(eq(tag.name, selectedTag)),
                )
              : undefined,
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
        orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
        with: {
          tags: {
            columns: {},
            with: {
              tag: {
                columns: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: orderPostTagsByName,
          },
        },
      })
      .then((rows) => rows.map((row) => flattenPostTags(row))),
    db.query.post
      .findMany({
        where: (table) => publishedWhere,
        columns: { id: true },
        with: {
          tags: {
            columns: {},
            with: {
              tag: {
                columns: {
                  name: true,
                },
              },
            },
          },
        },
      })
      .then((rows) => rows.map((row) => flattenPostTags(row))),
  ]);

  const tags = Array.from(
    new Set(
      allPublishedPosts.flatMap((post) => post.tags.map((tag) => tag.name)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    posts,
    tags,
    totalPosts: allPublishedPosts.length,
  };
}

export default function BlogPage(props: BlogPageProps) {
  return (
    <PublicRouteBoundary>
      <BlogContent {...props} />
    </PublicRouteBoundary>
  );
}

async function BlogContent({ searchParams }: BlogPageProps) {
  const selectedTag = getSelectedTag((await searchParams).tag);
  const { posts, tags, totalPosts } = await getBlogData(selectedTag);
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <main className={styles.page} data-public-page="blog">
      <div className={styles.container}>
        <BlogHero
          totalPosts={totalPosts}
          totalTags={tags.length}
          selectedTag={selectedTag}
        />

        <Suspense
          fallback={<div className="bg-surface border-y border-border h-24" />}
        >
          <BlogFilters tags={tags} selectedTag={selectedTag} />
        </Suspense>

        <div className={styles.summary}>
          <p>{formatBlogSummary(posts.length, selectedTag)}</p>
          {selectedTag && (
            <Link
              href="/blog"
              scroll={false}
              className="text-brand-soft hover:text-foreground hover:underline underline-offset-4 transition-colors"
            >
              Reset topic
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-7 md:gap-8 pt-8 md:pt-10 pb-12 md:pb-14">
          {featuredPost ? (
            <>
              <BlogReveal>
                <FeaturedPost post={featuredPost} />
              </BlogReveal>

              {remainingPosts.length > 0 && <PostList posts={remainingPosts} />}
            </>
          ) : (
            <EmptyPosts selectedTag={selectedTag} />
          )}
        </div>
      </div>
    </main>
  );
}
