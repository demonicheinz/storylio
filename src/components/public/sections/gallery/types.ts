export type GalleryItem = {
  id: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  order: number;
  createdAt: Date;
};

export type GalleryPhoto = GalleryItem & {
  src: string;
  alt: string;
  width: number;
  height: number;
};
