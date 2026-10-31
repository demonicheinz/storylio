import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { MotionReveal } from "@/components/common/motion";
import { SectionHeading } from "@/components/common/section-heading";
import { TiltedCard } from "@/components/common/tilted-card";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import styles from "./home.module.css";

export type HomeRecentProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  thumbnailImageUrl: string | null;
  isFeatured: boolean;
  techStack: string[];
};
export function RecentProjectsSection({
  projects,
}: {
  projects: HomeRecentProject[];
}) {
  return (
    <section
      id="selected-projects"
      className={styles.section}
      aria-labelledby="projects-title"
    >
      <MotionReveal>
        <div className={styles.sectionHeader}>
          <SectionHeading id="projects-title">
            Projects I’ve built
          </SectionHeading>
          <Link href="/projects" className={styles.sectionLink}>
            All projects <ArrowUpRightIcon size={16} aria-hidden="true" />
          </Link>
        </div>
        {projects.length > 0 ? (
          <div className={styles.cards} data-home-grid="projects">
            {projects.map((project) => (
              <Link
                href={`/projects/${project.slug}`}
                key={project.id}
                className={`group/project ${styles.card}`}
              >
                <TiltedCard>
                  <ProjectCover
                    src={project.thumbnailImageUrl ?? project.coverImage}
                    alt={project.title}
                    appearance="home"
                    className="aspect-video"
                    sizes="(min-width: 1328px) 394px, (min-width: 1200px) calc((100vw - 112px) / 3), (min-width: 768px) calc((100vw - 72px) / 2), calc(100vw - 50px)"
                  />
                </TiltedCard>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{project.title}</h3>
                  {project.description && (
                    <p className={styles.summary}>{project.description}</p>
                  )}
                  {project.techStack.length > 0 && (
                    <div className={styles.tags}>
                      {project.techStack.slice(0, 3).map((tech) => (
                        <span key={tech} className={styles.tag}>
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 3 && (
                        <span>
                          <span aria-hidden="true">
                            +{project.techStack.length - 3}
                          </span>
                          <span className="sr-only">
                            {project.techStack.length - 3} more technologies
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  <span className={styles.cardAction}>
                    View project{" "}
                    <ArrowUpRightIcon size={16} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className={styles.empty}>
            No projects published yet. Check back soon.
          </p>
        )}
      </MotionReveal>
    </section>
  );
}
