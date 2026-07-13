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
    <section className="py-10 w-full">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <h2 className="text-left heading">
          Featured
          <span className="text-brand-soft"> projects</span>
        </h2>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 bg-surface/60 px-4 py-2 border border-border/50 hover:border-brand-soft/50 rounded-full font-medium text-brand-soft hover:text-foreground text-sm transition-colors"
        >
          View all projects
          <ArrowUpRightIcon size={16} />
        </Link>
      </div>

      {projects.length > 0 ? (
        <div className="gap-6 grid grid-cols-1 md:grid-cols-2 mt-10">
          {projects.map((project) => {
            const visibleTech = project.techStack.slice(0, 3);
            const remainingTech = project.techStack.length - visibleTech.length;

            return (
              <Link
                href={`/projects/${project.slug}`}
                key={project.id}
                className="group/project flex flex-col bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_64px_rgba(139,92,246,0.14)] backdrop-blur-xl p-3 border border-border/40 hover:border-brand-soft/45 rounded-3xl h-full overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 duration-300"
              >
                <div className="relative">
                  <ProjectCover
                    src={project.thumbnailImageUrl ?? project.coverImage}
                    alt={project.title}
                    className="aspect-video"
                    sizes="(min-width: 1280px) 672px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
                  />
                  {project.isFeatured && (
                    <Badge className="top-3 left-3 absolute bg-brand-soft/90 shadow-[0_8px_24px_rgba(10,10,20,0.35)] backdrop-blur px-3 rounded-full text-primary-foreground pointer-events-none">
                      Featured
                    </Badge>
                  )}
                </div>

                <div className="flex flex-col flex-1 p-4">
                  <h3 className="font-heading font-semibold text-foreground group-hover/project:text-brand-soft text-2xl leading-tight transition-colors">
                    {project.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground text-sm line-clamp-2 leading-7">
                    {project.description ??
                      "A selected project from Heinz's archive."}
                  </p>

                  {project.techStack.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-5 max-w-full overflow-hidden">
                      {visibleTech.map((tech) => (
                        <Badge
                          key={`${project.id}-${tech}`}
                          variant="outline"
                          className="bg-background/35 border-border/90 rounded-full text-foreground/85 shrink-0"
                        >
                          {tech}
                        </Badge>
                      ))}
                      {remainingTech > 0 && (
                        <Badge
                          variant="outline"
                          className="bg-background/35 border-border/90 rounded-full text-foreground/85 shrink-0"
                          aria-label={`${remainingTech} more technologies`}
                        >
                          +{remainingTech}
                        </Badge>
                      )}
                    </div>
                  )}

                  <span className="inline-flex items-center gap-2 mt-auto pt-6 font-medium text-brand-soft text-sm">
                    View project
                    <ArrowUpRightIcon size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface/45 backdrop-blur-xl mt-10 p-8 border border-border/60 border-dashed rounded-3xl text-muted-foreground text-sm text-center leading-7">
          Published projects will appear here once they are added from the CMS.
        </div>
      )}
    </section>
  );
}
