export type DashboardPost = {
  id: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT";
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  tags: Array<{ name: string }>;
};

export type PostSortField =
  | "newest"
  | "updated"
  | "views"
  | "title"
  | "published";
export type PostSortDirection = "asc" | "desc";
