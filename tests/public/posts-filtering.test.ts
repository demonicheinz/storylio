import { describe, expect, it } from "vitest";
import {
  filterPosts,
  type PostFilters,
} from "@/features/dashboard/posts/filtering";
import {
  getPostViews,
  postHref,
} from "@/features/dashboard/posts/presentation";
import type { DashboardPost } from "@/features/dashboard/posts/types";

const due = Date.parse("2026-10-31T12:00:00Z");
const filters: PostFilters = {
  query: "",
  status: "all",
  selectedTags: [],
  sortMode: "newest",
  sortDirection: "desc",
};
const base: DashboardPost = {
  id: "article",
  title: "Quiet interfaces",
  slug: "calm-ui",
  status: "PUBLISHED",
  coverImage: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  publishedAt: "2026-10-03T00:00:00Z",
  viewCount: 12,
  tags: [{ name: "Design" }],
};
const posts: DashboardPost[] = [
  base,
  {
    ...base,
    id: "note",
    title: "A small experiment",
    slug: "note one&two",
    publishedAt: new Date(due).toISOString(),
    viewCount: 100,
    tags: [{ name: "notes" }, { name: "React" }],
  },
  {
    ...base,
    id: "draft",
    title: "Unfinished work",
    status: "DRAFT",
    publishedAt: null,
    viewCount: 99,
    tags: [],
  },
];
const ids = (overrides: Partial<PostFilters> = {}, now = due - 1) =>
  filterPosts(posts, { ...filters, ...overrides }, now).map((post) => post.id);

describe("Posts collection policy", () => {
  it("uses the supplied clock at the exact publication boundary", () => {
    expect(ids({ status: "published" })).toEqual(["article"]);
    expect(ids({ status: "scheduled" })).toEqual(["note"]);
    expect(ids({ status: "published" }, due)).toEqual(["article", "note"]);
    expect(ids({ status: "scheduled" }, due)).toEqual([]);
    expect(ids({ status: "draft" }, due)).toEqual(["draft"]);
  });

  it.each([
    [" QUIET ", ["article"]],
    ["calm-ui", ["article", "draft"]],
    ["react", ["note"]],
    ["scheduled", ["note"]],
    ["article", ["article", "draft"]],
    ["note", ["note"]],
  ] as const)(
    "searches title, slug, tag, publication state and content kind: %s",
    (query, expected) => {
      expect(ids({ query })).toEqual(expected);
    },
  );

  it("searches each field independently rather than across a joined boundary", () => {
    expect(ids({ query: "interfaces calm" })).toEqual([]);
    expect(ids({ query: "published" }, due)).toEqual(["article", "note"]);
  });

  it("matches any exact selected tag and intersects the other constraints", () => {
    expect(ids({ selectedTags: ["Design", "React"] })).toEqual([
      "article",
      "note",
    ]);
    expect(ids({ selectedTags: ["react"] })).toEqual([]);
    expect(ids({ selectedTags: ["React"], status: "published" })).toEqual([]);
    expect(
      ids({
        selectedTags: ["React"],
        status: "scheduled",
        query: "experiment",
      }),
    ).toEqual(["note"]);
  });

  it("sorts by public views using the same clock as the filter", () => {
    const sort: Partial<PostFilters> = {
      sortMode: "views",
      sortDirection: "desc",
    };
    expect(ids(sort)).toEqual(["article", "note", "draft"]);
    expect(ids(sort, due)).toEqual(["note", "article", "draft"]);
    expect(getPostViews(posts[1], due - 1)).toBe(0);
    expect(getPostViews(posts[1], due)).toBe(100);
    expect(getPostViews(posts[2], due)).toBe(0);
  });

  it.each(["asc", "desc"] as const)(
    "keeps undated posts last when sorting publication dates %s",
    (sortDirection) => {
      expect(ids({ sortMode: "published", sortDirection })).toEqual(
        sortDirection === "asc"
          ? ["article", "note", "draft"]
          : ["note", "article", "draft"],
      );
    },
  );

  it("keeps stable ties, handles whitespace/empty results and does not mutate records", () => {
    const before = structuredClone(posts);
    expect(ids({ query: " \n " })).toEqual(["article", "note", "draft"]);
    expect(ids({ query: "missing" })).toEqual([]);
    expect(filterPosts([], filters, due)).toEqual([]);
    expect(posts).toEqual(before);
  });

  it("keeps Note links encoded and separate from article detail links", () => {
    expect(postHref(posts[0])).toBe("/blog/calm-ui");
    expect(postHref(posts[1])).toBe("/blog?tag=notes&note=note%20one%26two");
    expect(postHref({ ...posts[1], tags: [{ name: "Notes" }] })).toBe(
      "/blog/note one&two",
    );
  });
});
