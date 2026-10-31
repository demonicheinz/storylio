import { getPostViews, isNote, isPublished, isScheduled } from "./presentation";
import type { DashboardPost, PostSortDirection, PostSortField } from "./types";

export type PostStatusFilter = "all" | "published" | "draft" | "scheduled";
export type PostFilters = {
  query: string;
  status: PostStatusFilter;
  selectedTags: string[];
  sortMode: PostSortField;
  sortDirection: PostSortDirection;
};

export function filterPosts(
  posts: DashboardPost[],
  { query, status, selectedTags, sortMode, sortDirection }: PostFilters,
  now: number,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return [...posts]
    .filter((post) => {
      if (status === "published" && !isPublished(post, now)) {
        return false;
      }

      if (status === "draft" && post.status !== "DRAFT") {
        return false;
      }

      if (status === "scheduled" && !isScheduled(post, now)) return false;

      if (
        selectedTags.length > 0 &&
        !post.tags.some((tag) => selectedTags.includes(tag.name))
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        post.title,
        post.slug,
        isScheduled(post, now)
          ? "scheduled"
          : isPublished(post, now)
            ? "published"
            : "draft",
        isNote(post) ? "note" : "article",
        ...post.tags.map((tag) => tag.name),
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortMode === "updated") {
        return (
          direction *
          (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        );
      }

      if (sortMode === "views") {
        return direction * (getPostViews(a, now) - getPostViews(b, now));
      }

      if (sortMode === "title") {
        return direction * a.title.localeCompare(b.title);
      }

      if (sortMode === "published") {
        // Undated posts stay last in either direction.
        if (!a.publishedAt) return b.publishedAt ? 1 : 0;
        if (!b.publishedAt) return -1;
        return (
          direction *
          (new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime())
        );
      }

      return (
        direction *
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      );
    });
}
