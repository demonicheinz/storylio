import { isPublished } from "./presentation";
import { compareProjects } from "./sorting";
import type {
  DashboardProject,
  ProjectSortDirection,
  ProjectSortField,
} from "./types";

export type ProjectStatusFilter = "all" | "published" | "draft";
export type ProjectFeaturedFilter = "all" | "featured" | "standard";

export type ProjectFilters = {
  query: string;
  status: ProjectStatusFilter;
  featured: ProjectFeaturedFilter;
  selectedTechStacks: string[];
  sortMode: ProjectSortField;
  sortDirection: ProjectSortDirection;
};

export function filterProjects(
  items: DashboardProject[],
  {
    query,
    status,
    featured,
    selectedTechStacks,
    sortMode,
    sortDirection,
  }: ProjectFilters,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return [...items]
    .filter((project) => {
      if (status === "published" && !isPublished(project)) {
        return false;
      }

      if (status === "draft" && isPublished(project)) {
        return false;
      }

      if (featured === "featured" && !project.isFeatured) {
        return false;
      }

      if (featured === "standard" && project.isFeatured) {
        return false;
      }

      if (
        selectedTechStacks.length > 0 &&
        !project.techStack.some((techStack) =>
          selectedTechStacks.includes(techStack),
        )
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        project.title,
        project.slug,
        project.description ?? "",
        ...project.techStack,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    })
    .sort((a, b) => compareProjects(a, b, sortMode, sortDirection));
}
