import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import { Badge } from "@/components/ui/badge";

export type HomeRecentProject = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  techStack: string[];
};

export function RecentProjectsSection({
  projects,
}: {
  projects: HomeRecentProject[];
}) {
  return (
    <section className="w-full py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="heading text-left">
          Featured
          <span className="text-brand-soft"> projects</span>
        </h2>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-surface/60 px-4 py-2 text-sm font-medium text-brand-soft transition-colors hover:border-brand-soft/50 hover:text-foreground"
        >
          View all projects
          <ArrowUpRightIcon size={16} />
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              href={`/projects/${project.slug}`}
              key={project.id}
              className="group/project flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-brand-soft/45 hover:shadow-[0_0_64px_rgba(139,92,246,0.14)]"
            >
              <ProjectCover
                src={project.coverImage}
                alt={project.title}
                className="aspect-[16/10]"
              />

              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-heading text-2xl leading-tight font-semibold text-foreground transition-colors group-hover/project:text-brand-soft">
                  {project.title}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-7 text-muted-foreground">
                  {project.description ??
                    "A selected project from Heinz's archive."}
                </p>

                {project.techStack.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {project.techStack.slice(0, 4).map((tech) => (
                      <Badge
                        key={`${project.id}-${tech}`}
                        variant="outline"
                        className="rounded-full border-border/60 bg-background/35 text-foreground/85"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}

                <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium text-brand-soft">
                  View project
                  <ArrowUpRightIcon size={16} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-border/60 bg-surface/45 p-8 text-center text-sm leading-7 text-muted-foreground backdrop-blur-xl">
          Published projects will appear here once they are added from the CMS.
        </div>
      )}
    </section>
  );
}
