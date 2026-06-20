import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import type { BlogPostListItem } from "@/components/public/sections/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateReadingTime, formatDate } from "@/lib/utils";

type PostCardProps = {
  post: BlogPostListItem;
};

export function PostCard({ post }: PostCardProps) {
  const publishedAt = post.publishedAt ?? post.createdAt;
  const visibleTags = post.tags.slice(0, 3);
  const remainingTags = post.tags.length - visibleTags.length;

  return (
    <article className="group/post grid overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] md:grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] md:items-center">
      <Link
        href={`/blog/${post.slug}`}
        aria-label={post.title}
        className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
      >
        <BlogCover
          src={post.coverImage}
          alt={post.title}
          className="aspect-video"
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 38vw, calc(100vw - 2rem)"
        />
      </Link>

      <div className="flex min-w-0 flex-col px-3 pt-4 pb-3 md:px-6 md:py-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(publishedAt)}</span>
          <span className="text-border">/</span>
          <span>{calculateReadingTime(post.content)} min read</span>
          <span className="text-border">/</span>
          <span>{post.viewCount} views</span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
        >
          <h2 className="font-heading text-2xl leading-tight font-semibold text-foreground transition-colors group-hover/post:text-brand-soft">
            {post.title}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-2 text-sm leading-6.5 text-muted-foreground">
          {post.excerpt ?? "A note from the Storylio writing archive."}
        </p>

        <div className="mt-4 flex max-w-full items-center gap-1.5 overflow-hidden">
          {visibleTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="rounded-full border-border/60 bg-background/35 text-foreground/85"
            >
              {tag.name}
            </Badge>
          ))}
          {remainingTags > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-border/60 bg-background/35 text-foreground/85"
              aria-label={`${remainingTags} more topics`}
            >
              +{remainingTags}
            </Badge>
          )}
        </div>

        <div className="mt-auto pt-5">
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/blog/${post.slug}`}>
              Read article
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
