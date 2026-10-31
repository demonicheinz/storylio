import type {
  DashboardProject,
  ProjectSortDirection,
  ProjectSortField,
} from "./types";

export function compareProjects(
  a: DashboardProject,
  b: DashboardProject,
  field: ProjectSortField,
  direction: ProjectSortDirection,
) {
  const multiplier = direction === "asc" ? 1 : -1;
  if (field === "updated") {
    return (
      multiplier *
      (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    );
  }
  if (field === "created") {
    return (
      multiplier *
      (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
  }
  if (field === "title") {
    return multiplier * a.title.localeCompare(b.title);
  }
  return multiplier * (a.order - b.order);
}
