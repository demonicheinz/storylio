import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProjectCard } from "@/components/public/sections/projects/project-card";
import type { ProjectListItem } from "@/components/public/sections/projects/types";

vi.mock("@/components/common/tilted-card", () => ({
  TiltedCard: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/components/public/sections/projects/project-cover", () => ({
  ProjectCover: () => createElement("div", { "data-test-cover": true }),
}));

const project: ProjectListItem = {
  id: "test",
  title: "Example project",
  slug: "example",
  description: "Existing demo description",
  contribution: "Existing contribution",
  coverImage: null,
  thumbnailImageUrl: null,
  isFeatured: true,
  isClosedSource: false,
  techStack: ["Next.js", "TypeScript"],
  liveUrl: "https://demo.example.com",
  githubUrl: "https://github.com/example/demo",
  order: 0,
};

describe("project archive cards", () => {
  it("shows the first three saved technologies and an accurate overflow count", () => {
    const stack = [
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Tailwind CSS",
      "Drizzle",
    ];
    const html = renderToStaticMarkup(
      createElement(ProjectCard, { project: { ...project, techStack: stack } }),
    );
    expect(html.match(/<li\b/g)).toHaveLength(4);
    for (const tech of stack.slice(0, 3))
      expect(html).toContain(`>${tech}</li>`);
    expect(html).toContain('aria-label="2 more technologies"');
    expect(html).toContain("+2</li>");
    expect(html).not.toContain(">Tailwind CSS</li>");
    expect(html).not.toContain(">Drizzle</li>");
    expect(stack).toEqual([
      "Next.js",
      "TypeScript",
      "PostgreSQL",
      "Tailwind CSS",
      "Drizzle",
    ]);
  });
  it.each([0, 1, 3])(
    "does not add an overflow indicator for %s technologies",
    (count) => {
      const html = renderToStaticMarkup(
        createElement(ProjectCard, {
          project: {
            ...project,
            techStack: ["Next.js", "React", "TypeScript"].slice(0, count),
          },
        }),
      );
      expect(html.match(/<li\b/g) ?? []).toHaveLength(count);
      expect(html).not.toContain("more technologies");
    },
  );
  it("keeps full title and description text available to CSS and assistive technology", () => {
    const title = "A detailed project title ".repeat(10);
    const description =
      "The full saved project description remains unchanged. ".repeat(20);
    const html = renderToStaticMarkup(
      createElement(ProjectCard, {
        project: { ...project, title, description },
      }),
    );
    expect(html).toContain(title);
    expect(html).toContain(description);
  });
  it.each([false, true])(
    "has one case-study link and preserves external links (featured=%s)",
    (featured) => {
      const html = renderToStaticMarkup(
        createElement(ProjectCard, { project, featured }),
      );
      expect(html.match(/href="\/projects\/example"/g)).toHaveLength(1);
      expect(html).toContain('href="https://demo.example.com"');
      expect(html).toContain('href="https://github.com/example/demo"');
      expect(html.match(/<h2\b/g)).toHaveLength(1);
    },
  );
  it("uses the same cover-first layout with a badge for featured projects", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectCard, { project, featured: true }),
    );
    expect(html).toContain('data-featured="true"');
    expect(html).toContain("Featured");
    expect(html.indexOf("data-test-cover")).toBeLessThan(html.indexOf("<h2"));
    expect(html).toContain("data-flow-button");
    expect(html).toContain("data-tilt-target");
  });
  it("does not expose source links for closed-source projects", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectCard, {
        project: { ...project, isClosedSource: true },
      }),
    );
    expect(html).not.toContain('href="https://github.com/example/demo"');
  });
});
