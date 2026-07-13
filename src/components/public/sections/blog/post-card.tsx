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
    <article className="group/post md:items-center grid md:grid-cols-[minmax(260px,0.62fr)_minmax(0,1fr)] bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] backdrop-blur-xl p-3 border border-border/40 hover:border-brand-soft/45 rounded-3xl overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300">
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

      <div className="flex flex-col px-3 md:px-6 md:py-4 pt-4 pb-3 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-3 text-muted-foreground text-xs">
          <span>{formatDate(publishedAt)}</span>
          <span className="text-border">/</span>
          <span>{calculateReadingTime(post.content)} min read</span>
          <span className="text-border">/</span>
          <span>{post.viewCount} views</span>
        </div>

        <Link
          href={`/blog/${post.slug}`}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 w-fit"
        >
          <h2 className="font-heading font-semibold text-foreground group-hover/post:text-brand-soft text-2xl leading-tight transition-colors">
            {post.title}
          </h2>
        </Link>
        <p className="mt-3 text-muted-foreground text-sm line-clamp-2 leading-6.5">
          {post.excerpt ?? "A note from the Storylio writing archive."}
        </p>

        <div className="flex items-center gap-1.5 mt-4 max-w-full overflow-hidden">
          {visibleTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="bg-background/35 border-border/60 rounded-full text-foreground/85"
            >
              {tag.name}
            </Badge>
          ))}
          {remainingTags > 0 && (
            <Badge
              variant="outline"
              className="bg-background/35 border-border/60 rounded-full text-foreground/85 shrink-0"
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
