import { ProjectCard } from "./project-card";
import type { ProjectListItem } from "./types";
export function FeaturedProject({ project }: { project: ProjectListItem }) {
  return <ProjectCard project={project} featured />;
}
