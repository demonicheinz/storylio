import {
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import type { ProjectListItem } from "@/components/public/sections/projects/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getProjectContribution } from "@/lib/project-contribution";

type FeaturedProjectProps = {
  project: ProjectListItem;
};

export function FeaturedProject({ project }: FeaturedProjectProps) {
  const cardImage = project.thumbnailImageUrl ?? project.coverImage;
  const contribution =
    project.contribution ?? getProjectContribution(project.techStack);
  const visibleTech = project.techStack.slice(0, 3);
  const remainingTech = project.techStack.length - visibleTech.length;

  return (
    <section className="group/project relative bg-[linear-gradient(135deg,rgba(22,18,36,0.86),rgba(10,10,20,0.94)_48%,rgba(37,28,62,0.86))] shadow-[0_0_96px_rgba(139,92,246,0.16)] backdrop-blur-xl p-3 md:p-4 border border-brand-soft/25 rounded-[2rem] overflow-hidden">
      <div className="-top-32 right-10 absolute bg-brand-soft/20 blur-3xl rounded-full size-72 pointer-events-none" />
      <div className="-bottom-40 -left-16 absolute bg-indigo-500/10 blur-3xl rounded-full size-80 pointer-events-none" />

      <div className="relative items-center gap-5 lg:gap-7 grid lg:grid-cols-[3fr_2fr]">
        <div className="relative">
          <Link
            href={`/projects/${project.slug}`}
            aria-label={project.title}
            className="block rounded-[1.55rem] outline-none focus-visible:ring-2 focus-visible:ring-brand-soft/60"
          >
            <ProjectCover
              src={cardImage}
              alt={project.title}
              fetchPriority="high"
              className="shadow-[0_0_80px_rgba(139,92,246,0.18)] border-brand-soft/20 rounded-[1.55rem] aspect-video"
              loading="eager"
              sizes="(min-width: 1280px) 672px, (min-width: 1024px) 58vw, calc(100vw - 2rem)"
            />
          </Link>
          <Badge className="top-3 md:top-4 left-3 md:left-4 absolute bg-brand-soft/90 shadow-[0_8px_24px_rgba(10,10,20,0.35)] backdrop-blur px-3 rounded-full text-primary-foreground pointer-events-none">
            Featured
          </Badge>
        </div>

        <div className="flex flex-col justify-between md:p-4 px-2 lg:py-5 pt-1 lg:pr-6 pb-2 min-w-0">
          <div>
            <div className="flex items-center gap-1.5 mb-3 max-w-full overflow-hidden">
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
              <h2 className="font-heading font-semibold text-foreground group-hover/project:text-brand-soft text-3xl sm:text-4xl md:text-5xl leading-none transition-colors">
                {project.title}
              </h2>
            </Link>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base md:text-lg line-clamp-3 leading-6 sm:leading-7 md:leading-8">
              {project.description ??
                "A selected project from Heinz's archive, focused on thoughtful implementation and polished interaction."}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mt-4">
              <span className="font-semibold text-[0.65rem] text-brand-soft uppercase tracking-[0.22em]">
                Contribution
              </span>
              <span className="text-border" aria-hidden="true">
                /
              </span>
              <p className="font-medium text-foreground/90 text-sm">
                {contribution}
              </p>
            </div>
          </div>

          <div className="mt-5">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="rounded-full">
                <Link href={`/projects/${project.slug}`}>
                  Read case study
                  <ArrowUpRightIcon data-icon="inline-end" />
                </Link>
              </Button>

              {project.liveUrl && (
                <Button
                  asChild
                  variant="outline"
                  className="bg-surface/70 border-border/60 rounded-full"
                >
                  <Link href={project.liveUrl} target="_blank" rel="noreferrer">
                    Live site
                    <ArrowUpRightIcon data-icon="inline-end" />
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
        </div>
      </div>
    </section>
  );
}
