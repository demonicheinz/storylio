import { EyeIcon } from "@phosphor-icons/react/dist/ssr";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { ViewCounter } from "@/components/public/sections/blog/view-counter";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime, formatDate } from "@/lib/utils";
import type { BlogPostListItem } from "./types";

type ArticleHeaderProps = {
  post: BlogPostListItem;
};

export function ArticleHeader({ post }: ArticleHeaderProps) {
  const publishedAt = post.publishedAt ?? post.createdAt;

  return (
    <header className="flex flex-col gap-7">
      <div className="max-w-4xl">
        <p className="mb-4 text-xs font-semibold tracking-[0.32em] text-brand-soft uppercase">
          Article / {formatDate(publishedAt)}
        </p>
        <h1 className="font-heading text-4xl leading-tight font-bold text-foreground md:text-6xl lg:text-7xl">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground md:text-xl">
            {post.excerpt}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4 border-y border-border/30 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{calculateReadingTime(post.content)} min read</span>
          <span className="text-border">/</span>
          <span className="inline-flex items-center gap-1.5">
            <EyeIcon size={16} className="text-brand-soft" />
            <ViewCounter slug={post.slug} initialViews={post.viewCount} />
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="rounded-full border-border/90 bg-background/35 text-foreground/85"
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
        className="aspect-video shadow-[0_0_80px_rgba(139,92,246,0.14)]"
        sizes="(min-width: 1280px) 1216px, calc(100vw - 2rem)"
      />
    </header>
  );
}
