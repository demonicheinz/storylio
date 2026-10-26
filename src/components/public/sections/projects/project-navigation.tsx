import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import styles from "@/components/public/public-detail.module.css";

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
        <h2 className="mt-2 font-heading font-semibold text-foreground text-2xl">
          Continue exploring
        </h2>
      </div>

      <nav aria-label="Project navigation" className={styles.adjacent}>
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
    return <div className="hidden md:block" />;
  }

  const isNext = direction === "next";
  const Icon = isNext ? ArrowRightIcon : ArrowLeftIcon;

  return (
    <Link href={`/projects/${project.slug}`}>
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
        className={`mt-4 font-heading text-2xl font-semibold text-foreground transition-colors group-hover:text-brand-soft ${
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
