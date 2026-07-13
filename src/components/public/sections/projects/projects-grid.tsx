import { ProjectCard } from "@/components/public/sections/projects/project-card";
import { ProjectReveal } from "@/components/public/sections/projects/project-reveal";
import type { ProjectListItem } from "@/components/public/sections/projects/types";

type ProjectsGridProps = {
  projects: ProjectListItem[];
};

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  return (
    <div className="items-stretch gap-5 lg:gap-6 grid md:grid-cols-2">
      {projects.map((project, index) => (
        <ProjectReveal key={project.id} delay={Math.min(index * 0.06, 0.24)}>
          <ProjectCard project={project} />
        </ProjectReveal>
      ))}
    </div>
  );
}
