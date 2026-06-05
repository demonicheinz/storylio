export type GalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  description: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
  isVisible: boolean;
  order: number;
  createdAt: Date;
};

export type GalleryPhoto = GalleryItem & {
  src: string;
  alt: string;
  width: number;
  height: number;
};
