import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { and, desc, eq, isNull, lte, or } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import detail from "@/components/public/public-detail.module.css";
import page from "@/components/public/public-page.module.css";
import reading from "@/components/public/reading.module.css";
import articleStyles from "@/components/public/sections/blog/article.module.css";
import { ArticleHeader } from "@/components/public/sections/blog/article-header";
import { ArticleNavigation } from "@/components/public/sections/blog/article-navigation";
import { ArticleProgress } from "@/components/public/sections/blog/article-progress";
import { ArticleToc } from "@/components/public/sections/blog/article-toc";
import { RelatedPosts } from "@/components/public/sections/blog/related-posts";
import { ShareButton } from "@/components/public/sections/blog/share-button";
import { db } from "@/lib/db";
import { PostStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";
import { postToTag, tag } from "@/lib/db/schema";
import { HOME_NOTES_TAG, homePostWhere } from "@/lib/home-content";
import { buildNotePermalink } from "@/lib/note-links";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";
import { renderPublicMDX } from "@/lib/public-mdx";
import { SITE_NAME } from "@/lib/site";
import { slugify } from "@/lib/utils";

type BlogPostPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getPostBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.posts);

  return db.query.post
    .findFirst({
      where: (table) =>
        and(
          eq(table.slug, slug),
          eq(table.status, PostStatus.PUBLISHED),
          or(isNull(table.publishedAt), lte(table.publishedAt, new Date())),
        ),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        viewCount: true,
      },
      with: {
        tags: {
          columns: {},
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: orderPostTagsByName,
        },
      },
    })
    .then((row) => (row ? flattenPostTags(row) : null));
}

async function getArticleCompanions(currentPostId: string, tagNames: string[]) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.posts);

  const noteIds = db
    .select({ postId: postToTag.postId })
    .from(postToTag)
    .innerJoin(tag, eq(postToTag.tagId, tag.id))
    .where(eq(tag.name, HOME_NOTES_TAG));
  const posts = await db.query.post
    .findMany({
      where: (table) => homePostWhere(table, "writing", new Date(), noteIds),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        publishedAt: true,
        createdAt: true,
        viewCount: true,
      },
      orderBy: (table) => [desc(table.publishedAt), desc(table.createdAt)],
      with: {
        tags: {
          columns: {},
          with: {
            tag: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: orderPostTagsByName,
        },
      },
    })
    .then((rows) => rows.map((row) => flattenPostTags(row)));

  const sortedPosts = posts.toSorted((a, b) => {
    const aDate = a.publishedAt ?? a.createdAt;
    const bDate = b.publishedAt ?? b.createdAt;

    return bDate.getTime() - aDate.getTime();
  });
  const currentIndex = sortedPosts.findIndex(
    (post) => post.id === currentPostId,
  );
  const relatedTagNames = new Set(tagNames);
  const relatedPosts = sortedPosts
    .filter(
      (post) =>
        post.id !== currentPostId &&
        post.tags.some((tag) => relatedTagNames.has(tag.name)),
    )
    .slice(0, 3);

  return {
    previousPost: currentIndex >= 0 ? sortedPosts[currentIndex + 1] : undefined,
    nextPost: currentIndex > 0 ? sortedPosts[currentIndex - 1] : undefined,
    relatedPosts,
  };
}

function getTocItems(content: string) {
  const headings = content.matchAll(/^(#|##|###)\s+(.+)$/gm);
  const seenIds = new Map<string, number>();

  return Array.from(headings).map((heading) => {
    const level: 2 | 3 = heading[1] === "###" ? 3 : 2;
    const title = heading[2].replace(/[#*_`]/g, "").trim();
    const baseId = slugify(title);
    const count = seenIds.get(baseId) ?? 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    seenIds.set(baseId, count + 1);

    return {
      id,
      title,
      level,
    };
  });
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    post.excerpt ?? `Read ${post.title}, an article by Heinz on Storylio.`;
  const image =
    post.coverImage ?? `/og?title=${encodeURIComponent(post.title)}&type=post`;
  const canonical = post.tags.some((tag) => tag.name === HOME_NOTES_TAG)
    ? "/blog?tag=notes"
    : `/blog/${post.slug}`;

  return {
    title: `${post.title} — Storylio`,
    alternates: { canonical },
    description,
    openGraph: {
      title: `${post.title} — Storylio`,
      description,
      type: "article",
      siteName: SITE_NAME,
      url: canonical,
      publishedTime: post.publishedAt?.toISOString(),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} — Storylio`,
      description,
      images: [image],
    },
  };
}

export default function BlogPostPage(props: BlogPostPageProps) {
  return (
    <PublicRouteBoundary variant="post-detail">
      <BlogPostContent {...props} />
    </PublicRouteBoundary>
  );
}

async function BlogPostContent({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  if (post.tags.some((tag) => tag.name === HOME_NOTES_TAG))
    redirect(buildNotePermalink(post.slug));

  const [mdxContent, tocItems, companions] = await Promise.all([
    renderPublicMDX(post.content, "post"),
    Promise.resolve(getTocItems(post.content)),
    getArticleCompanions(
      post.id,
      post.tags.map((tag) => tag.name),
    ),
  ]);

  return (
    <main className={page.page} data-public-page="article">
      <ArticleProgress />
      <article className={`${page.container} ${detail.article}`}>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <Link href="/blog" className={page.link}>
            <ArrowLeftIcon size={16} aria-hidden="true" /> Back to writing
          </Link>
          <ShareButton title={post.title} />
        </div>
        <ArticleHeader post={post} />
        <div
          className={`${reading.layout} ${articleStyles.body}`}
          data-has-toc={tocItems.length > 0 || undefined}
        >
          <ArticleToc items={tocItems} />
          <section
            aria-label="Article content"
            className={`${reading.prose} storylio-article-content`}
          >
            {mdxContent}
          </section>
        </div>
        <RelatedPosts posts={companions.relatedPosts} />
        <ArticleNavigation
          previousPost={companions.previousPost}
          nextPost={companions.nextPost}
        />
      </article>
    </main>
  );
}
