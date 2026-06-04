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

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Writing",
    description:
      "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
    openGraph: {
      title: "Writing",
      description:
        "Read notes on web development, interface craft, and product building by Heinz.",
      type: "website",
      images: ["/og?title=Writing&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Writing",
      description:
        "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
      images: ["/og?title=Writing&type=page"],
    },
  };
}

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
    <main className="min-h-screen overflow-x-hidden">
      <PublicBackground variant="blog" />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col px-4 sm:px-6 lg:px-8">
        <BlogHero
          totalPosts={totalPosts}
          totalTags={tags.length}
          selectedTag={selectedTag}
        />

        <Suspense
          fallback={
            <div className="h-24 rounded-3xl border border-border/40 bg-surface/55 backdrop-blur-xl" />
          }
        >
          <BlogFilters tags={tags} selectedTag={selectedTag} />
        </Suspense>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{formatBlogSummary(posts.length, selectedTag)}</p>
          {selectedTag && (
            <Link
              href="/blog"
              scroll={false}
              className="text-brand-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Reset topic
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-8 py-10 md:py-12">
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
