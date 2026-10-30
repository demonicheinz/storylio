import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import { NotesCollection } from "@/components/public/notes/notes-collection";
import page from "@/components/public/public-page.module.css";
import styles from "@/components/public/sections/blog/blog.module.css";
import { BlogFilters } from "@/components/public/sections/blog/blog-filters";
import { BlogHero } from "@/components/public/sections/blog/blog-hero";
import { BlogPagination } from "@/components/public/sections/blog/blog-pagination";
import { EmptyPosts } from "@/components/public/sections/blog/empty-posts";
import { PostList } from "@/components/public/sections/blog/post-list";
import { getPage } from "@/lib/archive-pagination";
import { getPublicWriting } from "@/lib/public-writing";
import { getWritingTag } from "@/lib/writing-filters";

type BlogPageProps = {
  searchParams: Promise<{
    tag?: string | string[];
    page?: string | string[];
    note?: string | string[];
  }>;
};
export const metadata: Metadata = {
  title: "Writing — Storylio",
  description:
    "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
  openGraph: {
    title: "Writing — Storylio",
    description:
      "Read notes on web development, interface craft, and product building by Heinz.",
    type: "website",
    images: ["/og?title=Writing&type=page"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing — Storylio",
    description:
      "Notes on web development, interface craft, systems thinking, and product building by Ahmad Haizul Amany.",
    images: ["/og?title=Writing&type=page"],
  },
};
export default function BlogPage(props: BlogPageProps) {
  return (
    <PublicRouteBoundary variant="blog">
      <BlogContent {...props} />
    </PublicRouteBoundary>
  );
}
async function BlogContent({ searchParams }: BlogPageProps) {
  const query = await searchParams;
  const data = await getPublicWriting(
    getWritingTag(query.tag),
    getPage(query.page),
  );
  return (
    <main className={page.page} data-public-page="blog">
      <div className={page.container}>
        <BlogHero
          totalPosts={data.totalPosts}
          totalTags={data.tags.length}
          selectedTag={data.selectedTag}
        />
        <Suspense fallback={<div className="border-border border-y h-20" />}>
          <BlogFilters
            tags={data.tags}
            selectedTag={data.selectedTag}
            resultCount={data.totalResults}
            totalPosts={data.totalPosts}
          />
        </Suspense>
        <section
          id="writing-list"
          tabIndex={-1}
          aria-label={data.kind === "notes" ? "Notes" : "Articles"}
          className={styles.collection}
        >
          {data.kind === "notes" ? (
            <>
              {!data.posts.length && <EmptyPosts selectedTag="notes" />}
              <NotesCollection
                posts={data.posts}
                selectedSlug={getWritingTag(query.note)}
              />
            </>
          ) : data.posts.length ? (
            <PostList posts={data.posts} />
          ) : (
            <EmptyPosts selectedTag={data.selectedTag} />
          )}
          <Suspense>
            <BlogPagination
              pagination={data.pagination}
              notes={data.kind === "notes"}
            />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
