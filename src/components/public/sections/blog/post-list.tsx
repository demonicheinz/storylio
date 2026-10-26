import { MotionReveal } from "@/components/common/motion";
import styles from "@/components/public/public-page.module.css";
import { PostCard } from "./post-card";
import type { BlogPostListItem } from "./types";
export function PostList({ posts }: { posts: BlogPostListItem[] }) {
  return (
    <MotionReveal>
      <div className={styles.grid} data-post-grid>
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </MotionReveal>
  );
}
