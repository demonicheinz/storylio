import { PostCard } from "./post-card";
import type { BlogPostListItem } from "./types";
export function FeaturedPost({ post }: { post: BlogPostListItem }) {
  return <PostCard post={post} featured />;
}
