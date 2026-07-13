import {
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import type { ProjectListItem } from "@/components/public/sections/projects/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProjectCardProps = {
  project: ProjectListItem;
};

export function ProjectCard({ project }: ProjectCardProps) {
  const cardImage = project.thumbnailImageUrl ?? project.coverImage;
  const visibleTech = project.techStack.slice(0, 3);
  const remainingTech = project.techStack.length - visibleTech.length;

  return (
    <article className="group/project flex flex-col bg-surface/65 shadow-[0_0_48px_rgba(139,92,246,0.08)] hover:shadow-[0_0_72px_rgba(139,92,246,0.15)] backdrop-blur-xl p-3 border border-border/40 hover:border-brand-soft/45 rounded-3xl h-full overflow-hidden transition-[border-color,box-shadow,transform] hover:-translate-y-1 duration-300">
      <Link
        href={`/projects/${project.slug}`}
        aria-label={project.title}
        className="relative rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
      >
        <ProjectCover
          src={cardImage}
          alt={project.title}
          className="aspect-video"
          sizes="(min-width: 1280px) 536px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
        />
        {project.isFeatured && (
          <Badge className="top-3 left-3 absolute bg-brand-soft/90 shadow-[0_8px_24px_rgba(10,10,20,0.35)] backdrop-blur px-3 rounded-full text-primary-foreground pointer-events-none">
            Featured
          </Badge>
        )}
      </Link>

      <div className="flex flex-col flex-1 px-3 pt-4 pb-3">
        <div className="flex items-center gap-1.5 mb-3.5 max-w-full overflow-hidden">
          {visibleTech.map((tech) => (
            <Badge
              key={`${project.id}-${tech}`}
              variant="outline"
              className="bg-background/35 border-border/90 rounded-full text-foreground/85"
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

        <Link
          href={`/projects/${project.slug}`}
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60 w-fit"
        >
          <h2 className="font-heading font-semibold text-foreground group-hover/project:text-brand-soft text-2xl leading-tight transition-colors">
            {project.title}
          </h2>
        </Link>
        <p className="mt-3 text-muted-foreground text-sm line-clamp-3 leading-6.5">
          {project.description ?? "A selected project from Heinz's archive."}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-auto pt-5">
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/projects/${project.slug}`}>
              View case
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </Button>

          {project.liveUrl && (
            <Button
              asChild
              size="icon"
              variant="outline"
              className="bg-surface/70 border-border/60 rounded-full"
            >
              <Link
                href={project.liveUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${project.title} live site`}
              >
                <ArrowUpRightIcon />
              </Link>
            </Button>
          )}

          {!project.isClosedSource && project.githubUrl && (
            <Button
              asChild
              size="icon"
              variant="outline"
              className="bg-surface/70 border-border/60 rounded-full"
            >
              <Link
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${project.title} GitHub repository`}
              >
                <GithubLogoIcon />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
