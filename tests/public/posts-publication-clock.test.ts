import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PostsManager } from "@/features/dashboard/posts/components/posts-manager";

const mocks = vi.hoisted(() => ({ now: vi.fn(), status: "all" }));
vi.mock("@/features/dashboard/posts/components/use-publication-clock", () => ({
  usePublicationClock: mocks.now,
}));
vi.mock("@/features/dashboard/shared/hooks/use-dashboard-filter", () => ({
  useDashboardFilter: () => [mocks.status, vi.fn()],
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/features/dashboard/posts/actions", () => ({
  actionDeletePost: vi.fn(),
  actionDeletePosts: vi.fn(),
  actionMovePostsToDraft: vi.fn(),
  actionPublishPosts: vi.fn(),
}));
afterEach(() => vi.restoreAllMocks());

const due = Date.parse("2026-10-29T11:00:00Z");
const post = {
  id: "clock-post",
  title: "Clock boundary post",
  slug: "clock-boundary",
  status: "PUBLISHED" as const,
  publishedAt: new Date(due).toISOString(),
  createdAt: "2026-10-28T10:00:00Z",
  updatedAt: "2026-10-28T10:00:00Z",
  coverImage: null,
  viewCount: 17,
  tags: [],
};

describe("Posts manager publication clock", () => {
  it.each([
    {
      clock: due - 1,
      wall: due + 60_000,
      published: 0,
      scheduled: 1,
      views: 0,
      badge: "Scheduled",
    },
    {
      clock: due,
      wall: due - 60_000,
      published: 1,
      scheduled: 0,
      views: 17,
      badge: "Published",
    },
  ])("uses the shared clock $clock for summary, badges and views despite wall time", ({
    clock,
    wall,
    published,
    scheduled,
    views,
    badge,
  }) => {
    mocks.status = "all";
    mocks.now.mockReturnValue(clock);
    vi.spyOn(Date, "now").mockReturnValue(wall);
    const html = renderToStaticMarkup(
      createElement(PostsManager, { posts: [post] }),
    );
    const text = html.replace(/<[^>]+>/g, "");
    expect(text).toContain(
      `Published${published}Drafts0Scheduled${scheduled}Views${views}`,
    );
    expect(html).toContain(`${badge}</span>`);
    expect(text).toContain(`${views} views`);
  });

  it.each([
    { clock: due - 1, wall: due + 60_000, status: "scheduled" },
    { clock: due, wall: due - 60_000, status: "published" },
  ])("filters $status using the shared clock rather than wall time", ({
    clock,
    wall,
    status,
  }) => {
    mocks.status = status;
    mocks.now.mockReturnValue(clock);
    vi.spyOn(Date, "now").mockReturnValue(wall);
    const text = renderToStaticMarkup(
      createElement(PostsManager, { posts: [post] }),
    ).replace(/<[^>]+>/g, "");
    expect(text).toContain("1 post found");
    expect(text).toContain(post.title);
    expect(text).not.toContain("No posts match these filters");
  });
});
