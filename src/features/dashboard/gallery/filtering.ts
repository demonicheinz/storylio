import { getFileName } from "./presentation";
import type { DashboardGalleryItem } from "./types";

export type GalleryVisibilityFilter = "all" | "visible" | "hidden";
export type GallerySortField = "order" | "created";
export type GalleryFilters = {
  query: string;
  visibility: GalleryVisibilityFilter;
  category: string;
  sortMode: GallerySortField;
  sortDirection: "asc" | "desc";
};

export function filterGalleryItems(
  items: DashboardGalleryItem[],
  { query, visibility, category, sortMode, sortDirection }: GalleryFilters,
) {
  const search = query.trim().toLowerCase();
  return items
    .filter(
      (item) =>
        (visibility === "all" ||
          item.isVisible === (visibility === "visible")) &&
        (category === "all" || item.category === category) &&
        (!search ||
          [
            item.caption,
            item.description,
            item.altText,
            item.category,
            getFileName(item.imageUrl),
          ].some((value) => value?.toLowerCase().includes(search))),
    )
    .sort(
      (a, b) =>
        (sortMode === "created"
          ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
          : a.order - b.order) * (sortDirection === "asc" ? 1 : -1),
    );
}
