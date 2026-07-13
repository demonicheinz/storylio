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
        <p className="mb-4 font-semibold text-brand-soft text-xs uppercase tracking-[0.32em]">
          Article / {formatDate(publishedAt)}
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
  );
}
