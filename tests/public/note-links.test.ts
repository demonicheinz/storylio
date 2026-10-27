import { describe, expect, it } from "vitest";
import { buildNoteHref, buildNotePermalink } from "@/lib/note-links";

describe("note dialog URLs", () => {
  it("uses the existing Notes archive for shareable links", () => {
    expect(buildNotePermalink("a & b")).toBe("/blog?tag=notes&note=a+%26+b");
  });
  it("opens and closes in place while preserving archive page and unrelated state", () => {
    const opened = buildNoteHref(
      "/blog",
      "tag=notes&page=2&keep=yes",
      "a-note",
      "#reading",
    );
    expect(opened).toBe("/blog?tag=notes&page=2&keep=yes&note=a-note#reading");
    expect(
      buildNoteHref(
        "/blog",
        opened.split("?")[1].split("#")[0],
        undefined,
        "#reading",
      ),
    ).toBe("/blog?tag=notes&page=2&keep=yes#reading");
    expect(buildNoteHref("/", "note=old", undefined)).toBe("/");
  });
});
