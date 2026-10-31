import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostsManager } from "@/features/dashboard/posts/components/posts-manager";
import type { DashboardPost } from "@/features/dashboard/posts/types";

const sorting = vi.hoisted(() => ({ field: "newest", direction: "desc" }));
vi.mock("react", async (importOriginal) => {
  const react = await importOriginal<typeof import("react")>();
  return {
    ...react,
    useState: (initial: unknown) =>
      react.useState(
        initial === "newest"
          ? sorting.field
          : initial === "desc"
            ? sorting.direction
            : initial,
      ),
  };
});
vi.mock("@/features/dashboard/posts/components/use-publication-clock", () => ({
  usePublicationClock: () => Date.parse("2026-10-29T11:00:00Z"),
}));
vi.mock("@/features/dashboard/shared/hooks/use-dashboard-filter", () => ({
  useDashboardFilter: () => ["all", vi.fn()],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/dashboard/posts/actions", () => ({
  actionDeletePost: vi.fn(),
  actionDeletePosts: vi.fn(),
  actionMovePostsToDraft: vi.fn(),
  actionPublishPosts: vi.fn(),
}));

function post(id: string, overrides: Partial<DashboardPost>): DashboardPost {
  return {
    id,
    title: id,
    slug: id,
    status: "PUBLISHED",
    coverImage: null,
    createdAt: "2026-10-01T00:00:00Z",
    updatedAt: "2026-10-01T00:00:00Z",
    publishedAt: "2026-10-01T00:00:00Z",
    viewCount: 1,
    tags: [],
    ...overrides,
  };
}

function renderedOrder(posts: DashboardPost[]) {
  const html = renderToStaticMarkup(createElement(PostsManager, { posts }));
  // The first occurrence of each edit link belongs to the desktop list.
  return posts
    .map(({ id }) => ({
      id,
      index: html.indexOf(`/dashboard/posts/${id}/edit`),
    }))
    .sort((a, b) => a.index - b.index)
    .map(({ id }) => id);
}

describe("Posts sort direction", () => {
  it.each([
    ["newest", { createdAt: "2026-10-02T00:00:00Z" }],
    ["updated", { updatedAt: "2026-10-02T00:00:00Z" }],
    ["views", { viewCount: 12 }],
    ["title", { title: "Zulu" }],
    ["published", { publishedAt: "2026-10-02T00:00:00Z" }],
  ] as const)(
    "orders %s independently in either direction",
    (field, higher) => {
      const posts = [post("low", { title: "Alpha" }), post("high", higher)];
      sorting.field = field;
      sorting.direction = "asc";
      expect(renderedOrder(posts)).toEqual(["low", "high"]);
      sorting.direction = "desc";
      expect(renderedOrder(posts)).toEqual(["high", "low"]);
    },
  );

  it.each(["asc", "desc"])("keeps undated posts last when %s", (direction) => {
    sorting.field = "published";
    sorting.direction = direction;
    const posts = [
      post("undated-a", { publishedAt: null }),
      post("dated", {}),
      post("undated-b", { publishedAt: null }),
    ];
    expect(renderedOrder(posts)).toEqual(["dated", "undated-a", "undated-b"]);
  });

  it.each(["asc", "desc"])(
    "uses public views with the shared clock when %s",
    (direction) => {
      sorting.field = "views";
      sorting.direction = direction;
      const posts = [
        post("public", { viewCount: 10 }),
        post("draft", { status: "DRAFT", viewCount: 100 }),
        post("scheduled", {
          publishedAt: "2026-10-30T00:00:00Z",
          viewCount: 200,
        }),
        post("due", { publishedAt: "2026-10-29T11:00:00Z", viewCount: 20 }),
      ];
      expect(renderedOrder(posts)).toEqual(
        direction === "asc"
          ? ["draft", "scheduled", "public", "due"]
          : ["due", "public", "draft", "scheduled"],
      );
    },
  );
});
