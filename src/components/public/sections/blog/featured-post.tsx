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
    <section className="group/post relative overflow-hidden rounded-[2rem] border border-brand-soft/25 bg-[linear-gradient(135deg,rgba(22,18,36,0.86),rgba(10,10,20,0.94)_48%,rgba(37,28,62,0.86))] p-3 shadow-[0_0_96px_rgba(139,92,246,0.16)] backdrop-blur-xl md:p-4">
      <div className="pointer-events-none absolute -top-32 right-10 size-72 rounded-full bg-brand-soft/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-16 size-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative grid items-center gap-5 lg:grid-cols-[3fr_2fr] lg:gap-7">
        <div className="relative">
          <Link
            href={`/blog/${post.slug}`}
            aria-label={post.title}
            className="block rounded-[1.55rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
          >
            <BlogCover
              src={post.coverImage}
              alt={post.title}
              className="aspect-video rounded-[1.55rem] border-brand-soft/20 shadow-[0_0_80px_rgba(139,92,246,0.18)]"
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1280px) 672px, (min-width: 1024px) 58vw, calc(100vw - 2rem)"
            />
          </Link>
          <Badge className="pointer-events-none absolute top-3 left-3 rounded-full bg-brand-soft/90 px-3 text-primary-foreground shadow-[0_8px_24px_rgba(10,10,20,0.35)] backdrop-blur md:top-4 md:left-4">
            Latest article
          </Badge>
        </div>

        <div className="flex min-w-0 flex-col justify-between px-2 pt-1 pb-2 md:p-4 lg:py-5 lg:pr-6">
          <div>
            <div className="mb-3 flex max-w-full items-center gap-1.5 overflow-hidden">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="shrink-0 rounded-full border-border/90 bg-background/35 text-foreground/85"
                >
                  {tag.name}
                </Badge>
              ))}
              {remainingTags > 0 && (
                <Badge
                  variant="outline"
                  className="shrink-0 rounded-full border-border/90 bg-background/35 text-foreground/85"
                  aria-label={`${remainingTags} more topics`}
                >
                  +{remainingTags}
                </Badge>
              )}
            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
            >
              <h2 className="font-heading text-3xl leading-none font-semibold text-foreground transition-colors group-hover/post:text-brand-soft sm:text-4xl md:text-5xl">
                {post.title}
              </h2>
            </Link>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7 md:text-lg md:leading-8">
              {post.excerpt ?? "A note from the Storylio writing archive."}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
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
            <Button asChild className="w-fit rounded-full">
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
