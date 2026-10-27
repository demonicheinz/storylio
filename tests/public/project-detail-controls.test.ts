import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProjectNavigation } from "@/components/public/sections/projects/project-navigation";
import { ProjectToc } from "@/components/public/sections/projects/project-toc";

describe("project detail navigation", () => {
  it("offers a collapsed small-screen disclosure linked to its navigation", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectToc, {
        items: [{ id: "overview", title: "Overview", level: 2 }],
      }),
    );
    expect(html).toContain("On this page");
    expect(html).toContain('aria-expanded="false"');
    const controls = html.match(/aria-controls="([^"]+)"/)?.[1];
    expect(controls).toBeTruthy();
    expect(html).toContain(`id="${controls}"`);
    expect(html).toContain('aria-label="Project case study table of contents"');
  });

  it("does not add a disclosure or an empty navigation for absent content", () => {
    expect(renderToStaticMarkup(createElement(ProjectToc, { items: [] }))).toBe(
      "",
    );
    expect(renderToStaticMarkup(createElement(ProjectNavigation, {}))).toBe("");
  });
});
