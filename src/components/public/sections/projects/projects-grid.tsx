import { MotionReveal } from "@/components/common/motion";
import styles from "@/components/public/public-page.module.css";
import { ProjectCard } from "./project-card";
import type { ProjectListItem } from "./types";
export function ProjectsGrid({ projects }: { projects: ProjectListItem[] }) {
  return (
    <MotionReveal>
      <div className={styles.grid} data-project-grid>
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </MotionReveal>
  );
}
