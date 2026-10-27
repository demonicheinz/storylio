import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { SectionHeading } from "@/components/common/section-heading";
import styles from "@/components/public/public-detail.module.css";
import projectStyles from "./project-detail.module.css";

type ProjectNavigationItem = {
  title: string;
  slug: string;
  description: string | null;
};

type ProjectNavigationProps = {
  previousProject?: ProjectNavigationItem;
  nextProject?: ProjectNavigationItem;
};

export function ProjectNavigation({
  previousProject,
  nextProject,
}: ProjectNavigationProps) {
  if (!previousProject && !nextProject) {
    return null;
  }

  return (
    <section className="mt-16 md:mt-20 pt-9 md:pt-10 border-border/30 border-t">
      <div className="mb-5">
        <SectionHeading className="mt-2">Continue exploring</SectionHeading>
      </div>

      <nav
        aria-label="Project navigation"
        className={`${styles.adjacent} ${projectStyles.navigation}`}
      >
        <ProjectNavigationCard project={previousProject} direction="previous" />
        <ProjectNavigationCard project={nextProject} direction="next" />
      </nav>
    </section>
  );
}

function ProjectNavigationCard({
  project,
  direction,
}: {
  project?: ProjectNavigationItem;
  direction: "previous" | "next";
}) {
  if (!project) {
    return null;
  }

  const isNext = direction === "next";
  const Icon = isNext ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <Link className="group" href={`/projects/${project.slug}`}>
      <div
        className={`flex items-center gap-2 text-xs font-semibold tracking-[0.24em] text-muted-foreground uppercase ${
          isNext ? "justify-end text-right" : ""
        }`}
      >
        {!isNext && <Icon className="text-brand-soft" size={16} />}
        {isNext ? "Next project" : "Previous project"}
        {isNext && <Icon className="text-brand-soft" size={16} />}
      </div>
      <h2
        className={`mt-4 transition-colors group-hover:text-brand-soft ${
          isNext ? "text-right" : ""
        }`}
      >
        {project.title}
      </h2>
      {project.description && (
        <p
          className={`mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground ${
            isNext ? "text-right" : ""
          }`}
        >
          {project.description}
        </p>
      )}
    </Link>
  );
}
