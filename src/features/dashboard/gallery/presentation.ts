import type { DashboardGalleryItem } from "./types";

export function getItemTitle(item: DashboardGalleryItem) {
  return item.caption || item.altText || item.category || "Untitled image";
}

export function getFileName(imageUrl: string) {
  try {
    const pathname = new URL(imageUrl).pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    return imageUrl.split("/").filter(Boolean).pop() ?? "Unknown file";
  }
}

export function getDimensions(item: DashboardGalleryItem) {
  if (!item.width || !item.height) {
    return "Not stored";
  }

  return `${item.width} x ${item.height}`;
}

export function getGalleryAspectRatio(item: DashboardGalleryItem) {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  if (item.width && item.height && item.height > 0) {
    return item.width / item.height;
  }

  return 1;
}
