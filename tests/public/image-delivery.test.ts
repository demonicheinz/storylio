import { imageConfigDefault } from "next/dist/shared/lib/image-config";
import { ImageConfigContext } from "next/dist/shared/lib/image-config-context.shared-runtime";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BlogCover } from "@/components/public/sections/blog/blog-cover";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import { IMAGE_QUALITY, PUBLIC_COVER_IMAGE_SIZES } from "@/lib/image-policy";

describe("responsive cover delivery", () => {
  for (const [name, Cover] of [
    ["Blog", BlogCover],
    ["Project", ProjectCover],
  ] as const) {
    it(`${name} keeps thumbnails at 75 and requests detail variants at 85`, () => {
      const render = (quality?: number) =>
        renderToStaticMarkup(
          createElement(
            ImageConfigContext.Provider,
            {
              value: {
                ...imageConfigDefault,
                qualities: Object.values(IMAGE_QUALITY),
              },
            },
            createElement(Cover, {
              src: "/images/auth-earth.avif",
              alt: "Example cover",
              quality,
              sizes: PUBLIC_COVER_IMAGE_SIZES,
              className: "aspect-video",
            }),
          ),
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
