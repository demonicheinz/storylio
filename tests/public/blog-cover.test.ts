import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";

vi.mock("next/image", () => ({ default: () => createElement("img") }));

describe("public cover fallbacks", () => {
  it.each([
    [BlogCover, "Article cover unavailable"],
    [ProjectCover, "Project preview unavailable"],
  ] as const)(
    "reserves a cover area without inventing an image (%s)",
    (Cover, fallback) => {
      const html = renderToStaticMarkup(
        createElement(Cover, {
          src: null,
          alt: "Article title",
          className: "aspect-video",
        }),
      );
      expect(html).toContain(fallback);
      expect(html).toContain("aspect-video");
      expect(html).not.toContain("<img");
    },
  );
});
