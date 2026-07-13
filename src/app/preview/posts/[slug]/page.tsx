import { ArrowLeftIcon, EyeSlashIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicBackground } from "@/components/common";
import { ArticleProgress, ArticleToc } from "@/components/public/sections/blog";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PostStatus } from "@/generated/prisma";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { calculateReadingTime, formatDate, slugify } from "@/lib/utils";

type PreviewPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata: Metadata = {
  title: "Post Preview — Storylio",
  robots: {
    index: false,
    follow: false,
  },
};

async function requirePreviewSession() {
  try {
    await getActionSession();
  } catch {
    redirect("/sign-in");
  }
}

async function getPreviewPost(slug: string) {
  return db.post.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      publishedAt: true,
      createdAt: true,
      status: true,
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

export default async function PreviewPostPage({
  params,
}: PreviewPostPageProps) {
  await requirePreviewSession();

  const { slug } = await params;
  const post = await getPreviewPost(slug);

  if (!post) {
    notFound();
  }

  const content = post.content || "";
  const [mdxContent, tocItems] = await Promise.all([
    renderMDX(content),
    Promise.resolve(getTocItems(content)),
  ]);
  const publishedAt = post.publishedAt ?? post.createdAt;
  const isPublished = post.status === PostStatus.PUBLISHED;

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
            <Link href={`/dashboard/posts/${post.id}/edit`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back to editor
            </Link>
          </Button>

          <div className="inline-flex items-center gap-2 bg-brand-soft/10 px-3 py-1.5 border border-brand-soft/30 rounded-full font-medium text-brand-soft text-xs">
            <EyeSlashIcon className="size-4" />
            Preview mode
            <span className="text-border" aria-hidden="true">
              /
            </span>
            {isPublished ? "Published" : "Draft"}
          </div>
        </div>

        <header className="flex flex-col gap-7">
          <div className="max-w-4xl">
            <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
              Article preview / {formatDate(publishedAt)}
            </p>
            <h1 className="font-heading font-bold text-foreground text-4xl md:text-6xl lg:text-7xl leading-tight">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-6 max-w-3xl text-muted-foreground text-base md:text-xl leading-8">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-4 py-5 border-border/30 border-y">
            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
              <span>{calculateReadingTime(content)} min read</span>
              <span className="text-border">/</span>
              <span>No view tracking in preview</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="bg-background/35 border-border/90 rounded-full text-foreground/85"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <BlogCover
            src={post.coverImage}
            alt={post.title}
            fetchPriority="high"
            loading="eager"
            className="shadow-[0_0_80px_rgba(139,92,246,0.14)] aspect-video"
            sizes="(min-width: 1280px) 1216px, calc(100vw - 2rem)"
          />
        </header>

        <div className="items-start gap-10 grid xl:grid-cols-[minmax(0,1fr)_280px] mt-16 md:mt-20">
          <section
            aria-label="Article preview content"
            className="pl-5 sm:pl-8 lg:pl-10 border-border/30 border-l min-w-0"
          >
            <div className="flex flex-col gap-6 prose-invert [&>h2:first-child]:mt-0 [&>h2]:mt-20 [&>h3]:mt-12 [&>h2:first-child]:pt-0 [&>h2]:pt-2 min-w-0 max-w-4xl overflow-hidden storylio-article-content">
              {mdxContent}
            </div>
          </section>

          <ArticleToc items={tocItems} />
        </div>
      </article>
    </main>
  );
}
