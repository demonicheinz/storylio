import { ProjectStatus } from "@/lib/db/enums";
import type { DashboardProject } from "./types";

export function isPublished(project: DashboardProject) {
  return project.status === ProjectStatus.PUBLISHED;
}

export function formatDateTime(value: Date | string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
