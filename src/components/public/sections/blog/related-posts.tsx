import page from "@/components/public/public-page.module.css";
import { PostCard } from "./post-card";
import type { BlogPostListItem } from "./types";
export function RelatedPosts({ posts }: { posts: BlogPostListItem[] }) {
  if (!posts.length) return null;
  return (
    <section className={page.section} aria-labelledby="related-writing">
      <div className={page.sectionHeader}>
        <h2 id="related-writing" className={page.heading}>
          Keep reading
        </h2>
      </div>
      <div className={page.grid}>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
