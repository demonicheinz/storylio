import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { Badge } from "@/components/ui/badge";
import { calculateReadingTime, formatDate } from "@/lib/utils";

export type HomeRecentPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  tags: {
    id: string;
    name: string;
  }[];
};

export function RecentPostsSection({ posts }: { posts: HomeRecentPost[] }) {
  return (
    <section className="w-full py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="heading text-left">
          Latest
          <span className="text-brand-soft"> insights</span>
        </h2>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/60 px-4 py-2 text-sm font-medium text-brand-soft transition-colors hover:border-brand-soft/50 hover:text-foreground"
        >
          View all writing
          <ArrowUpRightIcon size={16} />
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {posts.map((post) => {
            const publishedAt = post.publishedAt ?? post.createdAt;

            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="group/post flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)]"
              >
                <BlogCover
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-16/10"
                />

                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDate(publishedAt)}</span>
                    <span className="text-border">/</span>
                    <span>{calculateReadingTime(post.content)} min read</span>
                  </div>

                  <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground transition-colors group-hover/post:text-brand-soft">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
                    {post.excerpt ??
                      "A note from the Storylio writing archive."}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="rounded-full border-border/60 bg-background/35 text-foreground/85"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-brand-soft">
                    Read article
                    <ArrowUpRightIcon size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-surface/45 p-8 text-center text-sm leading-7 text-muted-foreground backdrop-blur-xl">
          Published articles will appear here once they are added from the CMS.
        </div>
      )}
    </section>
  );
}
