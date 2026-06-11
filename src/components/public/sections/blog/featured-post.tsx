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

  return (
    <section className="group/post relative overflow-hidden rounded-[2rem] border border-brand-soft/25 bg-[linear-gradient(135deg,rgba(22,18,36,0.86),rgba(10,10,20,0.94)_48%,rgba(37,28,62,0.86))] p-3 shadow-[0_0_96px_rgba(139,92,246,0.16)] backdrop-blur-xl md:p-4">
      <div className="pointer-events-none absolute -top-32 right-10 size-72 rounded-full bg-brand-soft/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-16 size-80 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="relative grid gap-6 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8">
        <Link href={`/blog/${post.slug}`} aria-label={post.title}>
          <BlogCover
            src={post.coverImage}
            alt={post.title}
            className="aspect-16/10 h-full rounded-[1.55rem] border-brand-soft/20 shadow-[0_0_80px_rgba(139,92,246,0.18)] lg:aspect-auto"
            fetchPriority="high"
            loading="eager"
          />
        </Link>

        <div className="flex min-w-0 flex-col justify-between p-3 md:p-5 lg:py-7 lg:pr-7">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <Badge className="rounded-full bg-brand-soft px-4 py-1.5 text-primary-foreground">
                Latest Article
              </Badge>
              <span className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
                {formatDate(publishedAt)}
              </span>
            </div>

            <Link href={`/blog/${post.slug}`} className="w-fit">
              <h2 className="font-heading text-4xl leading-none font-semibold text-foreground transition-colors group-hover/post:text-brand-soft md:text-5xl">
                {post.title}
              </h2>
            </Link>
            <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
              {post.excerpt ?? "A note from the Storylio writing archive."}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="rounded-full border-border/90 bg-background/35 text-foreground/85"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 border-y border-border/35 py-5">
              <div>
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Reading time
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {calculateReadingTime(post.content)} min
                </p>
              </div>
              <div>
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Views
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {post.viewCount}
                </p>
              </div>
            </div>

            <Button asChild size="lg" className="w-fit rounded-full">
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
