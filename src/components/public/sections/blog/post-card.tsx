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

  return (
    <article className="group/post grid gap-5 rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] md:grid-cols-[240px_1fr]">
      <Link href={`/blog/${post.slug}`} aria-label={post.title}>
        <BlogCover
          src={post.coverImage}
          alt={post.title}
          className="aspect-16/10 h-full md:aspect-auto"
        />
      </Link>

      <div className="flex min-w-0 flex-col p-2 md:p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(publishedAt)}</span>
          <span className="text-border">/</span>
          <span>{calculateReadingTime(post.content)} min read</span>
          <span className="text-border">/</span>
          <span>{post.viewCount} views</span>
        </div>

        <Link href={`/blog/${post.slug}`} className="w-fit">
          <h2 className="font-heading text-2xl leading-tight font-semibold text-foreground transition-colors group-hover/post:text-brand-soft md:text-3xl">
            {post.title}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
          {post.excerpt ?? "A note from the Storylio writing archive."}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="rounded-full border-border/60 bg-background/35 text-foreground/85"
            >
              {tag.name}
            </Badge>
          ))}
        </div>

        <div className="mt-auto pt-6">
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
