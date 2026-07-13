import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import type { BlogPostListItem } from "@/components/public/sections/blog/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateReadingTime, formatDate } from "@/lib/utils";

type FeaturedPostProps = {
  post: BlogPostListItem;
};

export function FeaturedPost({ post }: FeaturedPostProps) {
  const publishedAt = post.publishedAt ?? post.createdAt;
  const visibleTags = post.tags.slice(0, 3);
  const remainingTags = post.tags.length - visibleTags.length;

  return (
    <section className="group/post relative bg-[linear-gradient(135deg,rgba(22,18,36,0.86),rgba(10,10,20,0.94)_48%,rgba(37,28,62,0.86))] shadow-[0_0_96px_rgba(139,92,246,0.16)] backdrop-blur-xl p-3 md:p-4 border border-brand-soft/25 rounded-[2rem] overflow-hidden">
      <div className="-top-32 right-10 absolute bg-brand-soft/20 blur-3xl rounded-full size-72 pointer-events-none" />
      <div className="-bottom-40 -left-16 absolute bg-indigo-500/10 blur-3xl rounded-full size-80 pointer-events-none" />

      <div className="relative items-center gap-5 lg:gap-7 grid lg:grid-cols-[3fr_2fr]">
        <div className="relative">
          <Link
            href={`/blog/${post.slug}`}
            aria-label={post.title}
            className="block rounded-[1.55rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
          >
            <BlogCover
              src={post.coverImage}
              alt={post.title}
              className="shadow-[0_0_80px_rgba(139,92,246,0.18)] border-brand-soft/20 rounded-[1.55rem] aspect-video"
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1280px) 672px, (min-width: 1024px) 58vw, calc(100vw - 2rem)"
            />
          </Link>
          <Badge className="top-3 md:top-4 left-3 md:left-4 absolute bg-brand-soft/90 shadow-[0_8px_24px_rgba(10,10,20,0.35)] backdrop-blur px-3 rounded-full text-primary-foreground pointer-events-none">
            Latest article
          </Badge>
        </div>

        <div className="flex flex-col justify-between md:p-4 px-2 lg:py-5 pt-1 lg:pr-6 pb-2 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-3 max-w-full overflow-hidden">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="bg-background/35 border-border/90 rounded-full text-foreground/85 shrink-0"
                >
                  {tag.name}
                </Badge>
              ))}
              {remainingTags > 0 && (
                <Badge
                  variant="outline"
                  className="bg-background/35 border-border/90 rounded-full text-foreground/85 shrink-0"
                  aria-label={`${remainingTags} more topics`}
                >
                  +{remainingTags}
                </Badge>
              )}
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 w-fit"
            >
              <h2 className="font-heading font-semibold text-foreground group-hover/post:text-brand-soft text-3xl sm:text-4xl md:text-5xl leading-none transition-colors">
                {post.title}
              </h2>
            </Link>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base md:text-lg line-clamp-3 leading-6 sm:leading-7 md:leading-8">
              {post.excerpt ?? "A note from the Storylio writing archive."}
            </p>
            <p className="mt-4 text-muted-foreground text-sm">
              {formatDate(publishedAt)}
              <span className="px-2 text-border" aria-hidden="true">
                /
              </span>
              {calculateReadingTime(post.content)} min read
              <span className="px-2 text-border" aria-hidden="true">
                /
              </span>
              {post.viewCount} views
            </p>
          </div>

          <div className="mt-5">
            <Button asChild className="rounded-full w-fit">
              <Link href={`/blog/${post.slug}`}>
                Read article
                <ArrowUpRightIcon data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
