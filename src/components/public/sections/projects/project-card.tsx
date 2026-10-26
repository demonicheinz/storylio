import {
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { TiltedCard } from "@/components/common/tilted-card";
import styles from "@/components/public/public-page.module.css";
import { ProjectCover } from "./project-cover";
import type { ProjectListItem } from "./types";

export function ProjectCard({
  project,
  featured = false,
}: {
  project: ProjectListItem;
  featured?: boolean;
}) {
  const href = `/projects/${project.slug}`;
  return (
    <article
      className={`${styles.card} ${featured ? styles.feature : ""}`}
      data-project-card
    >
      <Link href={href} aria-label={project.title} className={styles.cardMedia}>
        <TiltedCard>
          <ProjectCover
            src={project.thumbnailImageUrl ?? project.coverImage}
            alt={project.title}
            appearance="home"
            className="aspect-video"
            loading={featured ? "eager" : "lazy"}
            sizes={
              featured
                ? "(min-width: 1024px) 720px, 100vw"
                : "(min-width: 1328px) 400px, (min-width: 1200px) 31vw, (min-width: 768px) 46vw, 94vw"
            }
          />
        </TiltedCard>
      </Link>
      <div className={styles.cardBody}>
        {featured && <p className={styles.meta}>Featured project</p>}
        <Link href={href}>
          <h2 className={styles.cardTitle}>{project.title}</h2>
        </Link>
        {project.description && (
          <p className={styles.cardCopy}>{project.description}</p>
        )}
        <ul className={styles.tags} aria-label="Technology stack">
          {project.techStack.map((tech) => (
            <li key={tech} className={styles.tag}>
              {tech}
            </li>
          ))}
        </ul>
        {featured && project.contribution && (
          <p className={styles.meta}>My part: {project.contribution}</p>
        )}
        <div className={styles.cardActions}>
          <Link href={href} className={styles.link}>
            Read case study <ArrowUpRightIcon aria-hidden="true" size={16} />
          </Link>
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.link}
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
              className={styles.link}
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
