import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBackground } from "@/components/common";
import {
  ArticleHeader,
  ArticleNavigation,
  ArticleProgress,
  ArticleToc,
  RelatedPosts,
  ShareButton,
} from "@/components/public/sections/blog";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { slugify } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");

  return db.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
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
  });
}

async function getArticleCompanions(currentPostId: string, tagNames: string[]) {
  "use cache";
  cacheLife("minutes");

  const posts = await db.post.findMany({
    where: {
      status: PostStatus.PUBLISHED,
      OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
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
  });

  const sortedPosts = posts.toSorted((a, b) => {
    const aDate = a.publishedAt ?? a.createdAt;
    const bDate = b.publishedAt ?? b.createdAt;

    return bDate.getTime() - aDate.getTime();
  });
  const currentIndex = sortedPosts.findIndex(
    (post) => post.id === currentPostId,
  );
  const relatedTagNames = new Set(tagNames);
  const relatedPosts = sortedPosts
    .filter(
      (post) =>
        post.id !== currentPostId &&
        post.tags.some((tag) => relatedTagNames.has(tag.name)),
    )
    .slice(0, 3);

  return {
    previousPost: currentIndex >= 0 ? sortedPosts[currentIndex + 1] : undefined,
    nextPost: currentIndex > 0 ? sortedPosts[currentIndex - 1] : undefined,
    relatedPosts,
  };
}

function getTocItems(content: string) {
  const headings = content.matchAll(/^(##|###)\s+(.+)$/gm);
  const seenIds = new Map<string, number>();

  return Array.from(headings).map((heading) => {
    const level: 2 | 3 = heading[1] === "###" ? 3 : 2;
    const title = heading[2].replace(/[#*_`]/g, "").trim();
    const baseId = slugify(title);
    const count = seenIds.get(baseId) ?? 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    seenIds.set(baseId, count + 1);

    return {
      id,
      title,
      level,
    };
  });
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    post.excerpt ?? `Read ${post.title}, an article by Heinz on Storylio.`;
  const image =
    post.coverImage ?? `/og?title=${encodeURIComponent(post.title)}&type=post`;

  return {
    title: `${post.title} — Storylio`,
    description,
    openGraph: {
      title: `${post.title} — Storylio`,
      description,
      type: "article",
      siteName: "Storylio",
      publishedTime: post.publishedAt?.toISOString(),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Storylio`,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const [mdxContent, tocItems, companions] = await Promise.all([
    renderMDX(post.content),
    Promise.resolve(getTocItems(post.content)),
    getArticleCompanions(
      post.id,
      post.tags.map((tag) => tag.name),
    ),
  ]);

  return (
    <main className="min-h-screen">
      <ArticleProgress />
      <PublicBackground variant="blog" />

      <article className="relative mx-auto flex w-full max-w-[1280px] flex-col px-4 pt-32 pb-24 sm:px-6 lg:px-8 lg:pt-40">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <Button
            asChild
            variant="outline"
            className="rounded-full border-border/60 bg-surface/70 backdrop-blur"
          >
            <Link href="/blog">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to writing
            </Link>
          </Button>

          <ShareButton title={post.title} />
        </div>

        <ArticleHeader post={post} />

        <div className="mt-14 grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-3xl border border-border/40 bg-surface/65 p-6 shadow-[0_0_64px_rgba(139,92,246,0.1)] backdrop-blur-xl md:p-8">
            <div className="prose-invert flex max-w-none flex-col gap-5">
              {mdxContent}
            </div>

            <ArticleNavigation
              previousPost={companions.previousPost}
              nextPost={companions.nextPost}
            />
          </section>

          <ArticleToc items={tocItems} />
        </div>

        <RelatedPosts posts={companions.relatedPosts} />
      </article>
    </main>
  );
}
