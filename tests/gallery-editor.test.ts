import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { galleryItemActionSchema } from "@/features/dashboard/gallery/validations";
import { ImageUpload } from "@/features/dashboard/shared/components/image-upload";

describe("Gallery editor shared contracts", () => {
  it("keeps upload naming backwards compatible without optional props", () => {
    const html = renderToStaticMarkup(
      createElement(ImageUpload, { onChange() {} }),
    );
    expect(html).toContain("Drop an image here or click to upload");
    expect(html).not.toContain("aria-labelledby=");
  });
  it("names and describes the upload trigger and file input", () => {
    const html = renderToStaticMarkup(
      createElement(ImageUpload, {
        onChange() {},
        "aria-labelledby": "gallery-image-label",
        "aria-describedby": "gallery-image-error",
        "aria-invalid": true,
      }),
    );
    expect(html.match(/aria-labelledby="gallery-image-label"/g)).toHaveLength(
      2,
    );
    expect(html.match(/aria-describedby="gallery-image-error"/g)).toHaveLength(
      2,
    );
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
  });
  it("keeps image field semantics after the trigger becomes a preview", () => {
    const html = renderToStaticMarkup(
      createElement(ImageUpload, {
        value: "/fixture.png",
        onChange() {},
        "aria-labelledby": "gallery-image-label",
        "aria-describedby": "gallery-image-error",
        "aria-invalid": true,
      }),
    );
    expect(html).toContain('role="group"');
    expect(html).toContain('aria-labelledby="gallery-image-label"');
    expect(html).toContain('aria-describedby="gallery-image-error"');
    expect(html).toContain('aria-invalid="true"');
  });
  it("accepts create append and preserves explicit existing edit order", () => {
    const item = {
      imageUrl: "https://example.test/fixture.png",
      category: "Interface",
    };
    expect(galleryItemActionSchema.parse(item).order).toBe(0);
    expect(galleryItemActionSchema.parse({ ...item, order: 9 }).order).toBe(9);
  });
  it.each([
    ["caption", 180],
    ["altText", 180],
    ["description", 500],
  ] as const)(
    "validates %s at the same boundary as editor feedback",
    (field, limit) => {
      const item = {
        imageUrl: "https://example.test/fixture.png",
        category: "Interface",
      };
      expect(
        galleryItemActionSchema.safeParse({
          ...item,
          [field]: "x".repeat(limit),
        }).success,
      ).toBe(true);
      expect(
        galleryItemActionSchema.safeParse({
          ...item,
          [field]: "x".repeat(limit + 1),
        }).success,
      ).toBe(false);
    },
  );
});
