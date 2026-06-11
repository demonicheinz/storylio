import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import type { BlogPostListItem } from "@/components/public/sections/blog/types";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime, formatDate } from "@/lib/utils";

type RelatedPostsProps = {
  posts: BlogPostListItem[];
};

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mt-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
            Continue reading
          </p>
          <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground">
            Related notes
          </h2>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => {
          const publishedAt = post.publishedAt ?? post.createdAt;

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group/post flex min-w-0 flex-col overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)]"
            >
              <BlogCover
                src={post.coverImage}
                alt={post.title}
                className="aspect-16/10 rounded-2xl"
              />

              <div className="flex flex-1 flex-col p-2 pt-4">
                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(publishedAt)}</span>
                  <span className="text-border">/</span>
                  <span>{calculateReadingTime(post.content)} min</span>
                </div>

                <h3 className="font-heading text-xl leading-tight font-semibold text-foreground transition-colors group-hover/post:text-brand-soft">
                  {post.title}
                </h3>

                <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
                  {post.excerpt ?? "A note from the Storylio writing archive."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="rounded-full border-border/60 bg-background/35 text-foreground/85"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-brand-soft">
                  Read article
                  <ArrowUpRightIcon size={16} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
