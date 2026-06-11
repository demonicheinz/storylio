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

  return (
    <article className="group/project flex h-full flex-col overflow-hidden rounded-3xl border border-border/40 bg-surface/65 p-3 shadow-[0_0_48px_rgba(139,92,246,0.08)] backdrop-blur-xl transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-brand-soft/45 hover:shadow-[0_0_72px_rgba(139,92,246,0.15)]">
      <Link href={`/projects/${project.slug}`} aria-label={project.title}>
        <ProjectCover
          src={cardImage}
          alt={project.title}
          className="aspect-16/10"
        />
      </Link>

      <div className="flex flex-1 flex-col p-3 pt-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {project.techStack.slice(0, 4).map((tech) => (
            <Badge
              key={`${project.id}-${tech}`}
              variant="outline"
              className="rounded-full border-border/90 bg-background/35 text-foreground/85"
            >
              {tech}
            </Badge>
          ))}
        </div>

        <Link href={`/projects/${project.slug}`} className="w-fit">
          <h2 className="font-heading text-2xl font-semibold text-foreground transition-colors group-hover/project:text-brand-soft">
            {project.title}
          </h2>
        </Link>
        {project.isFeatured && (
          <Badge className="mt-3 w-fit rounded-full bg-brand-soft text-primary-foreground">
            Featured
          </Badge>
        )}
        <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted-foreground">
          {project.description ?? "A selected project from Heinz's archive."}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
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
