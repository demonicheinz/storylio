import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  PostActions,
  PostThumbnail,
  StatusBadge,
  TagPills,
} from "@/features/dashboard/posts/components/post-display";
import type { DashboardPost } from "@/features/dashboard/posts/types";
import { htmlText } from "../helpers/html-text";
import { renderWithImages } from "../helpers/render-with-images";

vi.mock("@/features/dashboard/posts/components/post-delete-button", () => ({
  PostDeleteButton: () => null,
}));

const due = Date.parse("2026-10-31T12:00:00Z");
const post: DashboardPost = {
  id: "one",
  title: "A small experiment",
  slug: "small-experiment",
  status: "PUBLISHED",
  coverImage: null,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-02T00:00:00Z",
  publishedAt: new Date(due).toISOString(),
  viewCount: 7,
  tags: [{ name: "notes" }],
};

describe("shared Posts item presentation", () => {
  it.each([
    [post, due - 1, "Scheduled"],
    [post, due, "Published"],
    [{ ...post, status: "DRAFT" as const }, due, "Draft"],
  ] as const)(
    "classifies a badge using the supplied clock: %s at %i",
    (post, now, expected) => {
      expect(
        htmlText(renderWithImages(createElement(StatusBadge, { post, now }))),
      ).toBe(expected);
    },
  );

  it("bounds a missing cover without rendering an image", () => {
    const html = renderWithImages(createElement(PostThumbnail, { post }));
    expect(html).toContain("aspect-video");
    expect(html).not.toContain("<img");
  });

  it("retains image identity and caller-provided responsive sizing", () => {
    const html = renderWithImages(
      createElement(PostThumbnail, {
        post: { ...post, coverImage: "/images/home-hero.avif" },
        sizes: "112px",
        className: "rounded-lg",
      }),
    );
    expect(html).toContain('alt="A small experiment"');
    expect(html).toContain('sizes="112px"');
    expect(html).toContain("home-hero.avif");
    expect(html).toContain("rounded-lg");
  });

  it("limits visible tags and reports the remaining count", () => {
    const tags = ["React", "TypeScript", "PostgreSQL", "Cloudinary"].map(
      (name) => ({ name }),
    );
    const text = htmlText(
      renderWithImages(createElement(TagPills, { tags, limit: 2 })),
    );
    expect(text).toBe("ReactTypeScript+2");
    expect(
      htmlText(renderWithImages(createElement(TagPills, { tags: [] }))),
    ).toBe("No tags");
  });

  it("keeps the per-item action trigger named and operable", () => {
    const html = renderWithImages(
      createElement(PostActions, { post, now: due, overlay: true }),
    );
    expect(html).toContain('aria-label="Open actions for A small experiment"');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain("bg-popover/80");
  });
});
