import {
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { FlowButton } from "@/components/common/flow-button";
import { TiltedCard } from "@/components/common/tilted-card";
import styles from "@/components/public/public-page.module.css";
import { ProjectCover } from "./project-cover";
import projectStyles from "./projects.module.css";
import type { ProjectListItem } from "./types";

export function ProjectCard({
  project,
  featured = project.isFeatured,
}: {
  project: ProjectListItem;
  featured?: boolean;
}) {
  const href = `/projects/${project.slug}`;
  return (
    <article
      className={`${styles.card} ${projectStyles.projectCard}`}
      data-project-card
      data-featured={featured || undefined}
      data-tilt-target
    >
      <div className={`${styles.cardMedia} ${projectStyles.media}`}>
        <TiltedCard>
          <ProjectCover
            src={project.thumbnailImageUrl ?? project.coverImage}
            alt={project.title}
            appearance="home"
            className="aspect-video"
            loading={featured ? "eager" : "lazy"}
            sizes="(min-width:1328px) 400px, (min-width:1200px) 31vw, (min-width:768px) 46vw, 94vw"
          />
        </TiltedCard>
        {featured && (
          <span className={projectStyles.featureBadge}>Featured</span>
        )}
      </div>
      <div className={styles.cardBody}>
        <h2 className={`${styles.cardTitle} ${projectStyles.title}`}>
          {project.title}
        </h2>
        <p
          className={`${styles.cardCopy} ${projectStyles.description}`}
          aria-hidden={project.description ? undefined : true}
        >
          {project.description}
        </p>
        <ul
          className={`${styles.tags} ${projectStyles.stack}`}
          aria-label="Technology stack"
        >
          {project.techStack.slice(0, 3).map((tech) => (
            <li key={tech} className={styles.tag}>
              {tech}
            </li>
          ))}
          {project.techStack.length > 3 && (
            <li
              className={styles.tag}
              aria-label={`${project.techStack.length - 3} more technologies`}
            >
              +{project.techStack.length - 3}
            </li>
          )}
        </ul>
        <div className={`${styles.cardActions} ${projectStyles.actions}`}>
          <FlowButton href={href}>Read case study</FlowButton>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className={`${styles.link} ${projectStyles.secondaryAction}`}
              aria-label={`Open ${project.title} live site`}
            >
              Live site <ArrowUpRightIcon aria-hidden="true" size={16} />
            </a>
          )}
          {!project.isClosedSource && project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer"
              className={`${styles.link} ${projectStyles.secondaryAction}`}
              aria-label={`Open ${project.title} GitHub repository`}
            >
              <GithubLogoIcon aria-hidden="true" size={18} /> Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
