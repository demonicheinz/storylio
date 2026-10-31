import { describe, expect, it } from "vitest";
import {
  filterProjects,
  type ProjectFilters,
} from "@/features/dashboard/projects/filtering";
import type { DashboardProject } from "@/features/dashboard/projects/types";
import { ProjectStatus } from "@/lib/db/enums";

const defaults: ProjectFilters = {
  query: "",
  status: "all",
  featured: "all",
  selectedTechStacks: [],
  sortMode: "order",
  sortDirection: "asc",
};

const projects: DashboardProject[] = [
  {
    id: "dashboard",
    title: "Calm Dashboard",
    slug: "private-workspace",
    description: "Analytics for teams",
    status: ProjectStatus.PUBLISHED,
    isFeatured: true,
    techStack: ["React", "TypeScript"],
    order: 2,
  },
  {
    id: "store",
    title: "Storefront",
    slug: "shop",
    description: null,
    status: ProjectStatus.DRAFT,
    isFeatured: true,
    techStack: ["Next.js"],
    order: 0,
  },
  {
    id: "notes",
    title: "Notes",
    slug: "small-notes",
    description: "A quiet notebook",
    status: ProjectStatus.PUBLISHED,
    isFeatured: false,
    techStack: ["React"],
    order: 1,
  },
].map((project) => ({
  ...project,
  coverImage: null,
  thumbnailImageUrl: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
}));

function ids(filters: Partial<ProjectFilters> = {}) {
  return filterProjects(projects, { ...defaults, ...filters }).map(
    (project) => project.id,
  );
}

describe("dashboard project filtering", () => {
  it("sorts without changing the source array or records", () => {
    const before = structuredClone(projects);
    expect(ids()).toEqual(["store", "notes", "dashboard"]);
    expect(ids({ sortDirection: "desc" })).toEqual([
      "dashboard",
      "notes",
      "store",
    ]);
    expect(projects).toEqual(before);
  });

  it.each([
    ["published", ["notes", "dashboard"]],
    ["draft", ["store"]],
  ] as const)("filters %s status", (status, expected) => {
    expect(ids({ status })).toEqual(expected);
  });

  it.each([
    ["featured", ["store", "dashboard"]],
    ["standard", ["notes"]],
  ] as const)("filters %s projects", (featured, expected) => {
    expect(ids({ featured })).toEqual(expected);
  });

  it.each(["  CALM  ", "private-workspace", "analytics", "typescript"])(
    "searches normalized title, slug, description and stack: %s",
    (query) => expect(ids({ query })).toEqual(["dashboard"]),
  );

  it("treats whitespace as an empty query and accepts missing descriptions", () => {
    expect(ids({ query: " \n " })).toEqual(["store", "notes", "dashboard"]);
    expect(ids({ query: "storefront" })).toEqual(["store"]);
  });

  it("matches any selected technology, using exact technology values", () => {
    expect(ids({ selectedTechStacks: ["React", "Next.js"] })).toEqual([
      "store",
      "notes",
      "dashboard",
    ]);
    expect(ids({ selectedTechStacks: ["react"] })).toEqual([]);
    expect(ids({ selectedTechStacks: ["Missing"] })).toEqual([]);
  });

  it("combines status, featured, stack and query constraints", () => {
    expect(
      ids({
        status: "published",
        featured: "standard",
        selectedTechStacks: ["React"],
        query: "notebook",
      }),
    ).toEqual(["notes"]);
    expect(ids({ status: "draft", selectedTechStacks: ["React"] })).toEqual([]);
  });

  it("applies the requested sort after filtering and preserves equal-value order", () => {
    expect(ids({ selectedTechStacks: ["React"], sortMode: "title" })).toEqual([
      "dashboard",
      "notes",
    ]);
    expect(ids({ sortMode: "updated", sortDirection: "desc" })).toEqual([
      "dashboard",
      "store",
      "notes",
    ]);
  });

  it("returns no results for empty collections or unmatched searches", () => {
    expect(filterProjects([], defaults)).toEqual([]);
    expect(ids({ query: "nonexistent" })).toEqual([]);
  });
});
