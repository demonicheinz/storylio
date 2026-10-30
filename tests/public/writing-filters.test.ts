import { describe, expect, it } from "vitest";
import { buildWritingFilterHref, getWritingTag } from "@/lib/writing-filters";

describe("writing filter URLs", () => {
  it("normalizes a legacy single tag and preserves unrelated query values", () => {
    expect(getWritingTag([" React ", "Ignored"])).toBe("React");
    expect(getWritingTag(" ")).toBeUndefined();
    expect(
      buildWritingFilterHref("/blog", "keep=yes&page=3&tag=Old", "React"),
    ).toBe("/blog?keep=yes&tag=React");
  });
  it("clears topic, page and an opened note when switching archives", () => {
    expect(
      buildWritingFilterHref("/blog", "tag=notes&page=2&note=old&keep=yes"),
    ).toBe("/blog?keep=yes");
  });
});
