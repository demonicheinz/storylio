import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import { IMAGE_QUALITY, PUBLIC_COVER_IMAGE_SIZES } from "@/lib/image-policy";
import { renderWithImages } from "../helpers/render-with-images";

describe("responsive cover delivery", () => {
  for (const [name, Cover] of [
    ["Blog", BlogCover],
    ["Project", ProjectCover],
  ] as const) {
    it(`${name} keeps thumbnails at 75 and requests detail variants at 85`, () => {
      const render = (quality?: number) =>
        renderWithImages(
          createElement(Cover, {
            src: "/images/auth-earth.avif",
            alt: "Example cover",
            quality,
            sizes: PUBLIC_COVER_IMAGE_SIZES,
            className: "aspect-video",
          }),
        );
      const thumbnail = render();
      const detail = render(IMAGE_QUALITY.detail);
      expect(thumbnail).toContain("q=75");
      expect(detail).toContain("q=85");
      expect(detail).toContain("srcSet=");
      expect(detail).toContain(`sizes="${PUBLIC_COVER_IMAGE_SIZES}"`);
      expect(detail).not.toContain("q=75");
    });
  }
});
