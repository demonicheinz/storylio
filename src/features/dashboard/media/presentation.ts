import type { MediaItem } from "./types";

export function formatUploadedDate(value: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getDimensions(item: MediaItem): string {
  if (!item.width || !item.height) {
    return "Unknown";
  }

  return `${item.width} × ${item.height}`;
}

export function getMediaAspectRatio(item: MediaItem): number {
  if (item.aspectRatio && item.aspectRatio > 0) {
    return item.aspectRatio;
  }

  if (item.width && item.height && item.height > 0) {
    return item.width / item.height;
  }

  return 1;
}

export function getFormatLabel(format: string): string {
  return format.toUpperCase();
}
