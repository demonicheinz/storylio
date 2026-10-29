import { describe, expect, it } from "vitest";
import {
  getMediaDisplayFilename,
  getMediaFilenameParts,
} from "@/features/dashboard/media/filename";
import { sortMediaItems } from "@/features/dashboard/media/sorting";

describe("Media filenames", () => {
  it.each([
    [
      "interface.final.preview.webp",
      "webp",
      "interface.final.preview",
      ".webp",
    ],
    ["my.photo.JPG", "jpg", "my.photo", ".JPG"],
    ["画像", "png", "画像", ".png"],
    ["plain", "", "plain", ""],
  ])(
    "keeps the suffix separate for %s",
    (filename, format, base, extension) => {
      expect(getMediaFilenameParts(filename, format)).toEqual({
        base,
        extension,
      });
      expect(getMediaDisplayFilename(filename, format)).toBe(base + extension);
    },
  );
});
describe("Media ordering", () => {
  const rows = [
    { filename: "c.webp", format: "WEBP", size: 300, createdAt: "2026-10-03" },
    { filename: "a.jpg", format: "jpg", size: 100, createdAt: "2026-10-01" },
    { filename: "b.png", format: "png", size: 200, createdAt: "2026-10-02" },
  ];
  it.each(["date", "size", "name", "format"] as const)(
    "supports both directions for %s without changing source data",
    (field) => {
      expect(
        sortMediaItems(rows, field, "asc").map((row) => row.filename),
      ).toEqual(["a.jpg", "b.png", "c.webp"]);
      expect(
        sortMediaItems(rows, field, "desc").map((row) => row.filename),
      ).toEqual(["c.webp", "b.png", "a.jpg"]);
      expect(rows[0].filename).toBe("c.webp");
    },
  );
  it("keeps names alphabetical within a format group", () => {
    expect(
      sortMediaItems(
        [
          { ...rows[0], filename: "z.webp" },
          { ...rows[0], filename: "a.webp" },
        ],
        "format",
        "desc",
      ).map((row) => row.filename),
    ).toEqual(["a.webp", "z.webp"]);
  });
});
