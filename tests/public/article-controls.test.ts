import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArticleNavigation } from "@/components/public/sections/blog/article-navigation";
import { ArticleToc } from "@/components/public/sections/blog/article-toc";

describe("article reading controls", () => {
  it("provides the same accessible small-screen disclosure as case studies", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleToc, {
        items: [{ id: "decisions", title: "Decisions", level: 2 }],
      }),
    );
    expect(html).toContain("On this page");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-label="Article table of contents"');
    expect(html).toContain("aria-controls=");
  });
  it("keeps missing navigation empty and presents one real neighbor without a placeholder", () => {
    expect(renderToStaticMarkup(createElement(ArticleNavigation, {}))).toBe("");
    const html = renderToStaticMarkup(
      createElement(ArticleNavigation, {
        nextPost: { title: "Next article", slug: "next", excerpt: null },
      }),
    );
    expect(html.match(/href="\/blog\/next"/g)).toHaveLength(1);
    expect(html).not.toContain("hidden md:block");
    expect(html).not.toContain("From the archive");
  });
});
