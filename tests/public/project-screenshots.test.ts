import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProjectScreenshots } from "@/components/public/sections/projects/project-screenshots";

vi.mock("yet-another-react-lightbox", () => ({ default: () => null }));

const screenshots = [
  {
    imageUrl: "/second.png",
    altText: "Settings screen",
    caption: "Settings",
    width: 1200,
    height: 800,
    order: 2,
  },
  {
    imageUrl: "/first.png",
    altText: "Dashboard screen",
    caption: "Overview",
    width: 1600,
    height: 900,
    order: 1,
  },
];

describe("project screenshot carousel", () => {
  it("keeps CMS ordering and exposes one active image with manual controls", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectScreenshots, {
        title: "Fixture",
        structuredScreenshots: screenshots,
      }),
    );
    expect(html).toContain('aria-roledescription="carousel"');
    expect(html).toContain('aria-label="Open Dashboard screen"');
    expect(html).not.toContain('aria-label="Open Settings screen"');
    expect(html).toContain('aria-label="Previous screenshot"');
    expect(html).toContain('aria-label="Next screenshot"');
    expect(html).toContain('aria-label="Screenshot 1 of 2"');
    expect(screenshots[0].imageUrl).toBe("/second.png");
  });

  it("omits navigation controls for a single image", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectScreenshots, {
        title: "Fixture",
        structuredScreenshots: [screenshots[0]],
      }),
    );
    expect(html).toContain('aria-label="Open Settings screen"');
    expect(html).not.toContain('aria-label="Next screenshot"');
    expect(html).not.toContain('aria-label="Previous screenshot"');
  });

  it("hides the section when there are no screenshots", () => {
    expect(
      renderToStaticMarkup(
        createElement(ProjectScreenshots, { title: "Fixture" }),
      ),
    ).toBe("");
  });

  it("only mounts the active image and two rear previews for a large gallery", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectScreenshots, {
        title: "Fixture",
        structuredScreenshots: Array.from({ length: 20 }, (_, index) => ({
          imageUrl: `/gallery-${index}.png`,
          order: index,
        })),
      }),
    );
    expect(html.match(/<img\b/g)).toHaveLength(3);
    expect(html).toContain('aria-label="Screenshot 1 of 20"');
    expect(html.match(/aria-label="Open /g)).toHaveLength(1);
  });
});
