import { describe, expect, it } from "vitest";
import {
  filterGalleryItems,
  type GalleryFilters,
} from "@/features/dashboard/gallery/filtering";
import {
  getDimensions,
  getFileName,
  getGalleryAspectRatio,
  getItemTitle,
} from "@/features/dashboard/gallery/presentation";
import type { DashboardGalleryItem } from "@/features/dashboard/gallery/types";

const defaults: GalleryFilters = {
  query: "",
  visibility: "all",
  category: "all",
  sortMode: "order",
  sortDirection: "asc",
};
const first: DashboardGalleryItem = {
  id: "one",
  imageUrl: "https://images.example.test/blue%20planet.avif?size=800",
  caption: "Night sky",
  category: "Space",
  description: "A quiet orbit",
  altText: "Blue atmosphere",
  width: 1200,
  height: 800,
  size: 1024,
  aspectRatio: null,
  blurDataUrl: null,
  isVisible: true,
  order: 2,
  createdAt: "2026-10-02T00:00:00Z",
};
const second: DashboardGalleryItem = {
  ...first,
  id: "two",
  caption: null,
  category: "Work",
  description: null,
  altText: null,
  imageUrl: "/images/desk.webp",
  isVisible: false,
  order: 1,
  createdAt: "2026-10-01T00:00:00Z",
};
const items = [first, second];
const ids = (filters: Partial<GalleryFilters> = {}) =>
  filterGalleryItems(items, { ...defaults, ...filters }).map((item) => item.id);

describe("Gallery collection policy", () => {
  it("intersects visibility, category and normalized search", () => {
    expect(ids({ visibility: "visible" })).toEqual(["one"]);
    expect(ids({ visibility: "hidden" })).toEqual(["two"]);
    expect(ids({ category: "Work", query: " desk " })).toEqual(["two"]);
    expect(ids({ category: "Work", visibility: "visible" })).toEqual([]);
    expect(ids({ category: "work" })).toEqual([]);
  });
  it.each([" NIGHT ", "quiet", "atmosphere", "space", "blue planet.avif"])(
    "searches optional metadata and decoded filenames: %s",
    (query) => {
      expect(ids({ query })).toEqual(["one"]);
    },
  );
  it.each(["order", "created"] as const)(
    "sorts %s in both directions without mutating the source",
    (sortMode) => {
      const before = structuredClone(items);
      expect(ids({ sortMode })).toEqual(["two", "one"]);
      expect(ids({ sortMode, sortDirection: "desc" })).toEqual(["one", "two"]);
      expect(items).toEqual(before);
    },
  );
  it("handles empty queries/results and stable ties", () => {
    expect(ids({ query: " \n " })).toEqual(["two", "one"]);
    expect(ids({ query: "missing" })).toEqual([]);
    expect(filterGalleryItems([], defaults)).toEqual([]);
    expect(
      filterGalleryItems([first, { ...first, id: "tied" }], defaults).map(
        (item) => item.id,
      ),
    ).toEqual(["one", "tied"]);
  });
  it("chooses caption, alt text, category and the untitled fallback in order", () => {
    expect(getItemTitle(first)).toBe("Night sky");
    expect(getItemTitle({ ...first, caption: null })).toBe("Blue atmosphere");
    expect(getItemTitle(second)).toBe("Work");
    expect(getItemTitle({ ...second, category: null })).toBe("Untitled image");
  });
  it("handles absolute, relative and malformed encoded filenames", () => {
    expect(getFileName(first.imageUrl)).toBe("blue planet.avif");
    expect(getFileName(second.imageUrl)).toBe("desk.webp");
    expect(getFileName("https://images.example.test/bad%zz.avif")).toBe(
      "bad%zz.avif",
    );
    expect(getFileName("")).toBe("Unknown file");
  });
  it("keeps stored dimensions separate from the aspect-ratio fallback", () => {
    expect(getDimensions(first)).toBe("1200 x 800");
    expect(getDimensions({ ...first, width: null })).toBe("Not stored");
    expect(getGalleryAspectRatio({ ...first, aspectRatio: 2 })).toBe(2);
    expect(getGalleryAspectRatio(first)).toBe(1.5);
    expect(getGalleryAspectRatio({ ...first, width: null, height: null })).toBe(
      1,
    );
  });
});
