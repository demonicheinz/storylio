import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PublicBackground } from "@/components/common";
import {
  BlogFilters,
  BlogHero,
  BlogReveal,
  EmptyPosts,
  FeaturedPost,
  PostList,
} from "@/components/public/sections/blog";
import { PostStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string | string[] | undefined;
  }>;
};

export const unstable_instant = {
  prefetch: "runtime",
  samples: [{ searchParams: { tag: null } }],
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

  const now = new Date();
  const publishedWhere = {
    status: PostStatus.PUBLISHED,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };

  const [posts, allPublishedPosts] = await Promise.all([
    db.post.findMany({
      where: {
        ...publishedWhere,
        ...(selectedTag
          ? {
              tags: {
                some: {
                  name: selectedTag,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        viewCount: true,
        tags: {
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: "asc",
          },
        },
      },
      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    }),
    db.post.findMany({
      where: publishedWhere,
      select: {
        id: true,
        tags: {
          select: {
            name: true,
          },
        },
      },
    }),
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

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const selectedTag = getSelectedTag((await searchParams).tag);
  const { posts, tags, totalPosts } = await getBlogData(selectedTag);
  const [featuredPost, ...remainingPosts] = posts;

  return (
    <main className="min-h-screen overflow-x-clip">
      <PublicBackground variant="blog" />

      <div className="relative flex flex-col mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-295">
        <BlogHero
          totalPosts={totalPosts}
          totalTags={tags.length}
          selectedTag={selectedTag}
        />

        <Suspense
          fallback={
            <div className="bg-surface/55 backdrop-blur-xl border border-border/40 rounded-3xl h-24" />
          }
        >
          <BlogFilters tags={tags} selectedTag={selectedTag} />
        </Suspense>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-4 px-1 text-muted-foreground text-sm">
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

      <div className="h-24" />
    </main>
  );
}
