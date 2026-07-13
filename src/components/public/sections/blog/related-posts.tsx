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
    <section className="mt-16 md:mt-20">
      <div className="flex justify-between items-end gap-4 mb-7 pb-5 border-border/30 border-b">
        <div>
          <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.28em]">
            Continue reading
          </p>
          <h2 className="mt-3 font-heading font-semibold text-foreground text-3xl">
            Related notes
          </h2>
        </div>
      </div>

      <div className="gap-4 grid md:grid-cols-3">
        {posts.map((post) => {
          const publishedAt = post.publishedAt ?? post.createdAt;

          return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group/post flex flex-col bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] backdrop-blur-xl p-3 border border-border/40 hover:border-brand-soft/45 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 min-w-0 overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300"
            >
              <BlogCover
                src={post.coverImage}
                alt={post.title}
                className="rounded-2xl aspect-video"
                sizes="(min-width: 1280px) 365px, (min-width: 768px) calc(33vw - 2rem), calc(100vw - 2rem)"
              />

              <div className="flex flex-col flex-1 p-2 pt-4">
                <div className="flex flex-wrap items-center gap-2 mb-3 text-muted-foreground text-xs">
                  <span>{formatDate(publishedAt)}</span>
                  <span className="text-border">/</span>
                  <span>{calculateReadingTime(post.content)} min</span>
                </div>

                <h3 className="font-heading font-semibold text-foreground group-hover/post:text-brand-soft text-xl leading-tight transition-colors">
                  {post.title}
                </h3>

                <p className="mt-3 text-muted-foreground text-sm line-clamp-2 leading-7">
                  {post.excerpt ?? "A note from the Storylio writing archive."}
                </p>

                <div className="flex flex-wrap gap-2 mt-5">
                  {post.tags.slice(0, 2).map((tag) => (
                    <Badge
                      key={tag.id}
                      variant="outline"
                      className="bg-background/35 border-border/60 rounded-full text-foreground/85"
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>

                <span className="inline-flex items-center gap-2 mt-auto pt-6 font-medium text-brand-soft text-sm">
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
