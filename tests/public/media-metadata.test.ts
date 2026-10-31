import { describe, expect, it } from "vitest";
import {
  getDimensions,
  getFormatLabel,
  getMediaAspectRatio,
} from "@/features/dashboard/media/presentation";
import type { MediaItem } from "@/features/dashboard/media/types";

const item: MediaItem = {
  id: "test",
  url: "/image.webp",
  publicId: "test/image",
  filename: "image.webp",
  size: 1024,
  format: "webp",
  width: 1200,
  height: 800,
  aspectRatio: 1.5,
  blurDataUrl: null,
  createdAt: "2026-10-30T00:00:00Z",
};

describe("media metadata presentation", () => {
  it("uses stored dimensions and format without changing the item", () => {
    const snapshot = structuredClone(item);
    expect(getDimensions(item)).toBe("1200 × 800");
    expect(getFormatLabel(item.format)).toBe("WEBP");
    expect(item).toEqual(snapshot);
  });
  it.each([{ width: null }, { height: null }, { width: 0 }, { height: 0 }])(
    "retains Unknown when dimensions are incomplete: %j",
    (dimensions) => {
      expect(getDimensions({ ...item, ...dimensions })).toBe("Unknown");
    },
  );
  it("prefers the stored ratio and otherwise derives it from dimensions", () => {
    expect(getMediaAspectRatio({ ...item, aspectRatio: 2 })).toBe(2);
    expect(getMediaAspectRatio({ ...item, aspectRatio: null })).toBe(1.5);
    expect(getMediaAspectRatio({ ...item, aspectRatio: 0 })).toBe(1.5);
  });
  it("retains a square fallback when ratio and dimensions are unavailable", () => {
    expect(
      getMediaAspectRatio({
        ...item,
        aspectRatio: null,
        width: null,
        height: null,
      }),
    ).toBe(1);
  });
});
