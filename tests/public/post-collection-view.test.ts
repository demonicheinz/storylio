import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  PostsGrid,
  PostsList,
} from "@/features/dashboard/posts/components/post-collection-view";
import type { DashboardPost } from "@/features/dashboard/posts/types";
import { htmlText } from "../helpers/html-text";
import { renderWithImages } from "../helpers/render-with-images";

vi.mock("@/features/dashboard/posts/components/post-delete-button", () => ({
  PostDeleteButton: () => null,
}));

const due = Date.parse("2026-10-31T12:00:00Z");
const post: DashboardPost = {
  id: "one",
  title: "One quiet experiment",
  slug: "quiet-experiment",
  status: "PUBLISHED",
  coverImage: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  publishedAt: new Date(due).toISOString(),
  viewCount: 42,
  tags: [{ name: "notes" }],
};

function render(view: "grid" | "list", batchMode: boolean, now = due) {
  const props = {
    posts: [post],
    now,
    batchMode,
    selectedIds: new Set([post.id]),
    onTogglePost() {},
  };
  return renderWithImages(
    view === "grid"
      ? createElement(PostsGrid, props)
      : createElement(PostsList, {
          ...props,
          onTogglePage() {},
          onMobilePostClick() {},
        }),
  );
}

describe.each(["grid", "list"] as const)("Posts %s presentation", (view) => {
  it("keeps passive titles linked to the editor", () => {
    const html = render(view, false);
    expect(html).toContain('href="/dashboard/posts/one/edit"');
    expect(htmlText(html)).toContain(post.title);
  });

  it("keeps selected batch titles as text instead of navigation", () => {
    const html = render(view, true);
    expect(html).not.toContain('href="/dashboard/posts/one/edit"');
    expect(html).toContain('aria-label="Select One quiet experiment"');
    expect(html).toContain('aria-checked="true"');
    expect(htmlText(html)).toContain(post.title);
  });

  it("uses one publication clock for badges and public view counts", () => {
    const before = htmlText(render(view, false, due - 1));
    expect(before).toContain("Scheduled");
    expect(before).toContain("0 views");
    const after = htmlText(render(view, false, due));
    expect(after).toContain("Published");
    expect(after).toContain("42 views");
    expect(after).not.toContain("Scheduled");
  });
});

it("exposes the page-selection checkbox only in list batch mode", () => {
  expect(render("list", false)).not.toContain(
    'aria-label="Select visible posts"',
  );
  expect(render("list", true)).toContain('aria-label="Select visible posts"');
});
