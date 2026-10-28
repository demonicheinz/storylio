import { describe, expect, it } from "vitest";
import { buildGalleryFilterHref } from "@/lib/gallery-filters";

describe("gallery category navigation", () => {
  it("replaces repeated categories and retains unrelated query values", () => {
    expect(
      buildGalleryFilterHref(
        "/gallery",
        "category=Old&keep=yes&category=Another",
        "Places & people",
      ),
    ).toBe("/gallery?keep=yes&category=Places+%26+people");
  });
  it("clears the category without removing other parameters", () => {
    expect(buildGalleryFilterHref("/gallery", "category=Life&keep=yes")).toBe(
      "/gallery?keep=yes",
    );
    expect(buildGalleryFilterHref("/gallery", "category=Life")).toBe(
      "/gallery",
    );
  });
});
