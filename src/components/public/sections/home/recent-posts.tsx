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
    <section className="py-10 w-full">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <h2 className="text-left heading">
          Latest
          <span className="text-brand-soft"> insights</span>
        </h2>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 bg-surface/60 px-4 py-2 border border-border/50 hover:border-brand-soft/50 rounded-full font-medium text-brand-soft hover:text-foreground text-sm transition-colors"
        >
          View all writing
          <ArrowUpRightIcon size={16} />
        </Link>
      </div>

      {posts.length > 0 ? (
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-10">
          {posts.map((post) => {
            const publishedAt = post.publishedAt ?? post.createdAt;

            return (
              <Link
                href={`/blog/${post.slug}`}
                key={post.id}
                className="group/post flex flex-col bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] backdrop-blur-xl p-3 border border-border/40 hover:border-brand-soft/45 rounded-3xl h-full overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300"
              >
                <BlogCover
                  src={post.coverImage}
                  alt={post.title}
                  className="aspect-video"
                  sizes="(min-width: 1280px) 438px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
                />

                <div className="flex flex-col flex-1 p-4">
                  <div className="flex flex-wrap items-center gap-2 mb-4 text-muted-foreground text-xs">
                    <span>{formatDate(publishedAt)}</span>
                    <span className="text-border">/</span>
                    <span>{calculateReadingTime(post.content)} min read</span>
                  </div>

                  <h3 className="font-heading font-semibold text-foreground group-hover/post:text-brand-soft text-2xl leading-tight transition-colors">
                    {post.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm line-clamp-2 leading-7">
                    {post.excerpt ??
                      "A note from the Storylio writing archive."}
                  </p>

                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-5">
                      {post.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="outline"
                          className="bg-background/35 border-border/60 rounded-full text-foreground/85"
                        >
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-2 mt-auto pt-6 font-medium text-brand-soft text-sm">
                    Read article
                    <ArrowUpRightIcon size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface/45 backdrop-blur-xl mt-10 p-8 border border-border/60 border-dashed rounded-3xl text-muted-foreground text-sm text-center leading-7">
          Published articles will appear here once they are added from the CMS.
        </div>
      )}
    </section>
  );
}
