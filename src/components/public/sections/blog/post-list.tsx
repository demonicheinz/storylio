import { BlogReveal } from "@/components/public/sections/blog/blog-reveal";
import { PostCard } from "@/components/public/sections/blog/post-card";
import type { BlogPostListItem } from "@/components/public/sections/blog/types";

type PostListProps = {
  posts: BlogPostListItem[];
};

export function PostList({ posts }: PostListProps) {
  return (
    <div className="flex flex-col gap-5">
      {posts.map((post, index) => (
        <BlogReveal key={post.id} delay={Math.min(index * 0.05, 0.2)}>
          <PostCard post={post} />
        </BlogReveal>
      ))}
    </div>
  );
}
