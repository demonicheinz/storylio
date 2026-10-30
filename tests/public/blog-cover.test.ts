import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";

vi.mock("next/image", () => ({ default: () => createElement("img") }));

describe("public blog cover", () => {
  it("reserves a cover area without inventing an image", () => {
    const html = renderToStaticMarkup(
      createElement(BlogCover, {
        src: null,
        alt: "Article title",
        className: "aspect-video",
      }),
    );
    expect(html).toContain("Article cover unavailable");
    expect(html).toContain("aspect-video");
    expect(html).not.toContain("<img");
  });
});
