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
    <article className="group/project flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-brand-soft/45 hover:shadow-[0_0_72px_rgba(139,92,246,0.15)]">
      <Link
        href={`/projects/${project.slug}`}
        aria-label={project.title}
        className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
      >
        <ProjectCover
          src={cardImage}
          alt={project.title}
          className="aspect-video"
          sizes="(min-width: 1280px) 536px, (min-width: 768px) calc(50vw - 2.5rem), calc(100vw - 2rem)"
        />
      </Link>

      <div className="flex flex-1 flex-col px-3 pt-4 pb-3">
        <div className="mb-3.5 flex max-w-full items-center gap-1.5 overflow-hidden">
          {visibleTech.map((tech) => (
            <Badge
              key={`${project.id}-${tech}`}
              variant="outline"
              className="rounded-full border-border/90 bg-background/35 text-foreground/85"
            >
              {tech}
            </Badge>
          ))}
          {remainingTech > 0 && (
            <Badge
              variant="outline"
              className="shrink-0 rounded-full border-border/90 bg-background/35 text-foreground/85"
              aria-label={`${remainingTech} more technologies`}
            >
              +{remainingTech}
            </Badge>
          )}
        </div>

        <Link
          href={`/projects/${project.slug}`}
          className="w-fit rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
        >
          <h2 className="font-heading text-2xl leading-tight font-semibold text-foreground transition-colors group-hover/project:text-brand-soft">
            {project.title}
          </h2>
        </Link>
        {project.isFeatured && (
          <Badge className="mt-2.5 w-fit rounded-full bg-brand-soft text-primary-foreground">
            Featured
          </Badge>
        )}
        <p className="mt-3 line-clamp-3 text-sm leading-6.5 text-muted-foreground">
          {project.description ?? "A selected project from Heinz's archive."}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
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
              className="rounded-full border-border/60 bg-surface/70"
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
              className="rounded-full border-border/60 bg-surface/70"
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
