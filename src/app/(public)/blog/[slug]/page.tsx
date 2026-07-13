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
  const headings = content.matchAll(/^(#|##|###)\s+(.+)$/gm);
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
    <main className="min-h-screen overflow-x-clip">
      <ArticleProgress />
      <PublicBackground variant="blog" />

      <article className="relative flex flex-col mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-24 w-full max-w-7xl">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <Button
            asChild
            variant="outline"
            className="bg-surface/70 backdrop-blur border-border/60 rounded-full"
          >
            <Link href="/blog">
              <ArrowLeftIcon data-icon="inline-start" />
              Back to writing
            </Link>
          </Button>

          <ShareButton title={post.title} />
        </div>

        <ArticleHeader post={post} />

        <div className="items-start gap-10 grid xl:grid-cols-[minmax(0,1fr)_280px] mt-16 md:mt-20">
          <section
            aria-label="Article content"
            className="pl-5 sm:pl-8 lg:pl-10 border-border/30 border-l min-w-0"
          >
            <div className="flex flex-col gap-6 prose-invert [&>h2:first-child]:mt-0 [&>h2]:mt-20 [&>h3]:mt-12 [&>h2:first-child]:pt-0 [&>h2]:pt-2 min-w-0 max-w-4xl overflow-hidden storylio-article-content">
              {mdxContent}
            </div>
          </section>

          <ArticleToc items={tocItems} />
        </div>

        <RelatedPosts posts={companions.relatedPosts} />
        <ArticleNavigation
          previousPost={companions.previousPost}
          nextPost={companions.nextPost}
        />
      </article>
    </main>
  );
}
