import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ProjectsPagination } from "@/components/public/sections/projects/projects-pagination";
import { getProjectPagination } from "@/lib/project-pagination";

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects",
  useSearchParams: () =>
    new URLSearchParams("tech=Next.js&tech=TypeScript&keep=yes"),
}));
describe("project pagination controls", () => {
  it("hides navigation when one page suffices", () => {
    expect(
      renderToStaticMarkup(
        createElement(ProjectsPagination, {
          pagination: getProjectPagination(1, 3),
        }),
      ),
    ).toBe("");
  });
  it("renders the range, current page, and query-preserving Next links", () => {
    const html = renderToStaticMarkup(
      createElement(ProjectsPagination, {
        pagination: getProjectPagination(1, 14),
      }),
    );
    expect(html).toContain('aria-label="Project pages"');
    expect(html).toContain("Showing 1–6 of 14 projects");
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toContain('aria-disabled="true"');
    expect(html).toContain(
      'href="/projects?tech=Next.js&amp;tech=TypeScript&amp;keep=yes&amp;page=2"',
    );
  });
});
