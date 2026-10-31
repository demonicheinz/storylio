export type DashboardGalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  description: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
  isVisible: boolean;
  order: number;
  createdAt: string;
};
