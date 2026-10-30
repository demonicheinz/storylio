import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostCard } from "@/components/public/sections/blog/post-card";

vi.mock("@/components/common/tilted-card", () => ({
  TiltedCard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/public/sections/blog/blog-cover", () => ({
  BlogCover: () => createElement("div", { "data-cover": true }),
}));
const post = {
  id: "test",
  slug: "test",
  title: "Title",
  excerpt: "Excerpt",
  content: "Text",
  coverImage: "/cover.png",
  publishedAt: null,
  createdAt: new Date("2026-01-01"),
  viewCount: 0,
  tags: ["React", "Web", "UX", "CSS"].map((name, index) => ({
    id: String(index),
    name,
  })),
};
describe("writing archive cards", () => {
  it("has one Flow CTA, bounded topics and a stable title outside the cover tilt", () => {
    const html = renderToStaticMarkup(createElement(PostCard, { post }));
    expect(html.match(/href="\/blog\/test"/g)).toHaveLength(1);
    expect(html).toContain("data-flow-button");
    expect(html).toContain("data-tilt-target");
    expect(html).toContain('aria-label="1 more topics"');
    expect(html).not.toContain(">CSS</li>");
  });
  it("preserves full text and does not fabricate a missing cover", () => {
    const title = "Long title ".repeat(20),
      excerpt = "Full excerpt ".repeat(30);
    const html = renderToStaticMarkup(
      createElement(PostCard, {
        post: { ...post, title, excerpt, coverImage: null },
      }),
    );
    expect(html).toContain(title);
    expect(html).toContain(excerpt);
    expect(html).not.toContain("data-cover");
  });
});
