import { describe, expect, it, vi } from "vitest";
import {
  compareProjects,
  type DashboardProject,
} from "@/features/dashboard/projects/components/projects-manager";
import { ProjectStatus } from "@/lib/db/enums";

vi.mock("@/features/dashboard/projects/actions", () => ({}));
vi.mock(
  "@/features/dashboard/projects/components/project-delete-button",
  () => ({ ProjectDeleteButton: () => null }),
);

const projects: DashboardProject[] = [
  { id: "middle", title: "Bravo", order: 5, day: 2 },
  { id: "last", title: "Charlie", order: 10, day: 3 },
  { id: "first", title: "Alpha", order: -1, day: 1 },
].map(({ day, ...project }) => ({
  ...project,
  slug: project.id,
  description: null,
  coverImage: null,
  thumbnailImageUrl: null,
  isFeatured: false,
  status: ProjectStatus.DRAFT,
  techStack: [],
  createdAt: new Date(`2026-01-0${day}T00:00:00Z`),
  updatedAt: new Date(`2026-02-0${4 - day}T00:00:00Z`),
}));

describe("Projects sort direction", () => {
  it.each(["order", "updated", "created", "title"] as const)(
    "sorts %s in both directions without changing the source",
    (field) => {
      const ascending =
        field === "updated"
          ? ["last", "middle", "first"]
          : ["first", "middle", "last"];

      expect(
        [...projects]
          .sort((a, b) => compareProjects(a, b, field, "asc"))
          .map((project) => project.id),
      ).toEqual(ascending);
      expect(
        [...projects]
          .sort((a, b) => compareProjects(a, b, field, "desc"))
          .map((project) => project.id),
      ).toEqual([...ascending].reverse());
      expect(projects.map((project) => project.id)).toEqual([
        "middle",
        "last",
        "first",
      ]);
    },
  );

  it.each(["order", "updated", "created", "title"] as const)(
    "keeps equal %s values stable in either direction",
    (field) => {
      const tied = [
        { ...projects[0], id: "a" },
        { ...projects[0], id: "b" },
      ];
      for (const direction of ["asc", "desc"] as const) {
        expect(
          [...tied]
            .sort((a, b) => compareProjects(a, b, field, direction))
            .map((project) => project.id),
        ).toEqual(["a", "b"]);
      }
    },
  );
});
