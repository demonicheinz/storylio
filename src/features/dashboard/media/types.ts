export type MediaItem = {
  id: string;
  url: string;
  publicId: string;
  filename: string;
  size: number;
  format: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  blurDataUrl: string | null;
  createdAt: Date | string;
};
