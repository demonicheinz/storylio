export type BlogTag = {
  id: string;
  name: string;
};

export type BlogPostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  viewCount: number;
  tags: BlogTag[];
};

export type TocItem = {
  id: string;
  title: string;
  level: 2 | 3;
};
