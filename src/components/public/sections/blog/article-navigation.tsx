import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

type ArticleNavigationItem = {
  title: string;
  slug: string;
  excerpt: string | null;
};

type ArticleNavigationProps = {
  previousPost?: ArticleNavigationItem;
  nextPost?: ArticleNavigationItem;
};

export function ArticleNavigation({
  previousPost,
  nextPost,
}: ArticleNavigationProps) {
  if (!previousPost && !nextPost) {
    return null;
  }

  return (
    <section className="mt-16 md:mt-20 pt-9 md:pt-10 border-border/30 border-t">
      <div className="mb-5">
        <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.28em]">
          From the archive
        </p>
        <h2 className="mt-2 font-heading font-semibold text-foreground text-2xl">
          Keep reading
        </h2>
      </div>

      <nav
        aria-label="Article navigation"
        className="gap-4 grid md:grid-cols-2"
      >
        <ArticleNavigationCard post={previousPost} direction="previous" />
        <ArticleNavigationCard post={nextPost} direction="next" />
      </nav>
    </section>
  );
}

function ArticleNavigationCard({
  post,
  direction,
}: {
  post?: ArticleNavigationItem;
  direction: "previous" | "next";
}) {
  if (!post) {
    return <div className="hidden md:block" />;
  }

  const isNext = direction === "next";
  const Icon = isNext ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] backdrop-blur-xl p-5 border border-border/40 hover:border-brand-soft/45 rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300"
    >
      <div
        className={`flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase ${
          isNext ? "justify-end text-right" : ""
        }`}
      >
        {!isNext && <Icon className="text-brand-soft" size={16} />}
        {isNext ? "Next article" : "Previous article"}
        {isNext && <Icon className="text-brand-soft" size={16} />}
      </div>

      <h2
        className={`mt-4 font-heading text-2xl font-semibold text-foreground transition-colors group-hover:text-brand-soft ${
          isNext ? "text-right" : ""
        }`}
      >
        {post.title}
      </h2>

      {post.excerpt && (
        <p
          className={`mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground ${
            isNext ? "text-right" : ""
          }`}
        >
          {post.excerpt}
        </p>
      )}
    </Link>
  );
}
