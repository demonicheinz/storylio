import { createElement } from "react";
import { expect, it } from "vitest";
import { ProfilePhoto } from "@/components/public/sections/about/profile-photo";
import { renderWithImages } from "../helpers/render-with-images";

it("includes the real portrait URL, dimensions and description before hydration", () => {
  const html = renderWithImages(
    createElement(ProfilePhoto, {
      src: "/uploads/portrait.webp",
      name: "Heinz",
    }),
  );
  expect(html).toContain("<img");
  expect(html).toContain("/_next/image?url=%2Fuploads%2Fportrait.webp");
  expect(html).toContain("srcSet=");
  expect(html).toContain('sizes="(max-width: 767px) 96px, 144px"');
  expect(html).toContain('alt="Portrait of Heinz"');
  expect(html).toContain('width="144" height="144"');
});

it.each([null, "/images/heinz.jpg"])(
  "keeps the shared orb fallback for %s",
  (src) => {
    const html = renderWithImages(
      createElement(ProfilePhoto, { src, name: "Heinz" }),
    );
    expect(html).not.toContain("<img");
    expect(html).toContain('aria-label="Heinz avatar"');
  },
);

it("keeps non-optimizer avatar hosts from throwing during server rendering", () => {
  const html = renderWithImages(
    createElement(ProfilePhoto, {
      src: "https://avatars.githubusercontent.com/u/123",
      name: "Heinz",
    }),
  );
  expect(html).toContain('src="https://avatars.githubusercontent.com/u/123"');
  expect(html).not.toContain("/_next/image");
});
