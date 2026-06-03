import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

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
    <nav
      aria-label="Project navigation"
      className="mt-16 grid gap-4 md:grid-cols-2"
    >
      <ProjectNavigationCard project={previousProject} direction="previous" />
      <ProjectNavigationCard project={nextProject} direction="next" />
    </nav>
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
    <Link
      href={`/projects/${project.slug}`}
      className="group rounded-3xl border border-border/40 bg-surface/65 p-5 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)]"
    >
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
