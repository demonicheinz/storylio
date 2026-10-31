import type { ProjectStatus } from "@/lib/db/enums";

export type DashboardProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  thumbnailImageUrl: string | null;
  isFeatured: boolean;
  status: ProjectStatus;
  techStack: string[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectSortField = "order" | "updated" | "created" | "title";
export type ProjectSortDirection = "asc" | "desc";
