import { describe, expect, it } from "vitest";
import {
  buildProjectFilterHref,
  normalizeProjectTechnologies,
} from "@/lib/project-filters";

describe("project stack filters", () => {
  it("keeps canonical URL ordering independent of display collation", () => {
    expect(normalizeProjectTechnologies(["alpine", "Zod"])).toEqual([
      "Zod",
      "alpine",
    ]);
  });
  it("preserves existing single-technology URLs and normalizes multi-selection", () => {
    expect(normalizeProjectTechnologies(" Next.js ")).toEqual(["Next.js"]);
    expect(
      normalizeProjectTechnologies(["React", " Next.js ", "", "React"]),
    ).toEqual(["Next.js", "React"]);
    expect(normalizeProjectTechnologies(undefined)).toEqual([]);
  });

  it("stores all selected technologies and preserves unrelated query state", () => {
    const href = buildProjectFilterHref(
      "/projects",
      "keep=example&tech=React&sort=recent",
      ["TypeScript", "Next.js", "Next.js"],
    );
    const url = new URL(href, "https://example.test");
    expect(url.searchParams.getAll("tech")).toEqual(["Next.js", "TypeScript"]);
    expect(url.searchParams.get("keep")).toBe("example");
    expect(url.searchParams.get("sort")).toBe("recent");
  });

  it("resets only tech and keeps the current pathname", () => {
    expect(
      buildProjectFilterHref(
        "/projects",
        "tech=React&keep=example&tech=TypeScript",
        [],
      ),
    ).toBe("/projects?keep=example");
    expect(buildProjectFilterHref("/projects", "tech=React", [])).toBe(
      "/projects",
    );
  });

  it("safely encodes technology names containing query punctuation", () => {
    const url = new URL(
      buildProjectFilterHref("/projects", "", ["C++", "a&b"]),
      "https://example.test",
    );
    expect(url.searchParams.getAll("tech")).toEqual(["C++", "a&b"]);
  });
});
