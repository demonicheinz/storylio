import { describe, expect, it } from "vitest";
import { buildProjectFilterHref } from "@/lib/project-filters";
import {
  buildProjectPageHref,
  getProjectPage,
  getProjectPageItems,
  getProjectPagination,
} from "@/lib/project-pagination";

describe("project pagination", () => {
  it.each([
    undefined,
    "",
    "0",
    "-1",
    "1.5",
    "Infinity",
    "999999999999999999999",
  ])("normalizes invalid page %s", (value) => {
    expect(getProjectPage(value)).toBe(1);
  });
  it("accepts integer pages and legacy array query values", () => {
    expect(getProjectPage("2")).toBe(2);
    expect(getProjectPage(["3", "4"])).toBe(3);
  });
  it("limits results to six and clamps pages to the matching result count", () => {
    expect(getProjectPagination(2, 14)).toEqual({
      page: 2,
      pageCount: 3,
      offset: 6,
      limit: 6,
      start: 7,
      end: 12,
      total: 14,
    });
    expect(getProjectPagination(99, 14).page).toBe(3);
    expect(getProjectPagination(5, 0)).toEqual({
      page: 1,
      pageCount: 0,
      offset: 0,
      limit: 6,
      start: 0,
      end: 0,
      total: 0,
    });
  });
  it("preserves every selected technology and unrelated queries in page links", () => {
    const url = new URL(
      buildProjectPageHref(
        "/projects",
        "tech=Next.js&keep=yes&tech=TypeScript",
        2,
      ),
      "https://example.test",
    );
    expect(url.searchParams.getAll("tech")).toEqual(["Next.js", "TypeScript"]);
    expect(url.searchParams.get("keep")).toBe("yes");
    expect(url.searchParams.get("page")).toBe("2");
    expect(buildProjectPageHref("/projects", "page=2&keep=yes", 1)).toBe(
      "/projects?keep=yes",
    );
  });
  it("returns to the first page whenever stack selection or reset changes", () => {
    const query = "page=3&keep=yes&tech=React";
    expect(buildProjectFilterHref("/projects", query, ["Next.js"])).toBe(
      "/projects?keep=yes&tech=Next.js",
    );
    expect(buildProjectFilterHref("/projects", query, [])).toBe(
      "/projects?keep=yes",
    );
  });
  it("keeps pagination compact without duplicate or missing current page numbers", () => {
    expect(getProjectPageItems(1, 1)).toEqual([1]);
    expect(getProjectPageItems(5, 10)).toEqual([
      1,
      "ellipsis",
      4,
      5,
      6,
      "ellipsis",
      10,
    ]);
    expect(getProjectPageItems(1, 3)).toEqual([1, 2, 3]);
  });
});
