import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  FeaturedProjectBadge,
  ProjectStatusBadge,
  TechPills,
} from "@/features/dashboard/projects/components/project-display";
import { ProjectsList } from "@/features/dashboard/projects/components/project-list";
import type { DashboardProject } from "@/features/dashboard/projects/types";
import { ProjectStatus } from "@/lib/db/enums";
import { htmlText } from "../helpers/html-text";
import { renderWithImages } from "../helpers/render-with-images";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/features/dashboard/projects/actions", () => ({
  actionReorderProjects: vi.fn(),
}));
vi.mock(
  "@/features/dashboard/projects/components/project-delete-button",
  () => ({ ProjectDeleteButton: () => null }),
);

const project: DashboardProject = {
  id: "one",
  title: "Fixture project",
  slug: "fixture",
  description: "A full description.",
  coverImage: null,
  thumbnailImageUrl: null,
  isFeatured: true,
  status: ProjectStatus.PUBLISHED,
  techStack: ["React", "TypeScript", "PostgreSQL", "Cloudinary", "Vitest"],
  order: 0,
  createdAt: new Date("2026-06-01T00:00:00Z"),
  updatedAt: new Date("2026-10-30T00:00:00Z"),
};
const render = (batchMode = false, canReorder = false) =>
  renderWithImages(
    createElement(ProjectsList, {
      projects: [project],
      batchMode,
      canReorder,
      selectedIds: new Set([project.id]),
      onToggleProject() {},
      onReorder() {},
    }),
  );

describe("dashboard project list contract", () => {
  it("keeps passive rows directly editable without a drag gutter", () => {
    const html = render();
    expect(html).toContain('href="/dashboard/projects/one/edit"');
    expect(html).not.toContain('aria-label="Drag ');
    expect(htmlText(html)).toContain("Fixture project");
    expect(htmlText(html)).toContain("Featured");
    expect(htmlText(html)).toContain("Published");
    expect(html).toContain("data-project-list-header");
  });
  it("renders a selected checkbox and plain title in batch mode", () => {
    const html = render(true);
    expect(html).toContain('aria-label="Select Fixture project"');
    expect(html).toContain('aria-checked="true"');
    expect(html).not.toContain('href="/dashboard/projects/one/edit"');
    expect(html).not.toContain('aria-label="Drag ');
  });
  it("exposes the named keyboard drag handle only during reorder", () => {
    const html = render(false, true);
    expect(html).toContain('aria-label="Drag Fixture project to reorder"');
    expect(html).toContain("touch-none");
  });
  it("keeps status and featured badges explicit on the shared surface", () => {
    expect(
      htmlText(
        renderWithImages(createElement(ProjectStatusBadge, { project })),
      ),
    ).toBe("Published");
    expect(
      htmlText(
        renderWithImages(
          createElement(ProjectStatusBadge, {
            project: { ...project, status: ProjectStatus.DRAFT },
          }),
        ),
      ),
    ).toBe("Draft");
    expect(
      htmlText(renderWithImages(createElement(FeaturedProjectBadge))),
    ).toBe("Featured");
  });
  it("retains bounded technology pills and the empty-state label", () => {
    const html = renderWithImages(
      createElement(TechPills, { techStack: project.techStack, limit: 2 }),
    );
    expect(htmlText(html)).toContain("ReactTypeScript+3 more");
    expect(html).not.toContain("PostgreSQL");
    expect(
      htmlText(renderWithImages(createElement(TechPills, { techStack: [] }))),
    ).toBe("No tech stack");
  });
});
