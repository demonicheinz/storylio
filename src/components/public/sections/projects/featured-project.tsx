import {
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import type { ProjectListItem } from "@/components/public/sections/projects/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type FeaturedProjectProps = {
  project: ProjectListItem;
};

export function FeaturedProject({ project }: FeaturedProjectProps) {
  return (
    <section className="group/project relative overflow-hidden rounded-[2rem] border border-brand-soft/25 bg-[linear-gradient(135deg,rgba(22,18,36,0.86),rgba(10,10,20,0.94)_48%,rgba(37,28,62,0.86))] p-3 shadow-[0_0_96px_rgba(139,92,246,0.16)] backdrop-blur-xl md:p-4">
      <div className="pointer-events-none absolute -top-32 right-10 size-72 rounded-full bg-brand-soft/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-16 size-80 rounded-full bg-indigo-500/10 blur-3xl" />
      <span className="pointer-events-none absolute top-5 right-6 font-heading text-7xl font-bold text-foreground/[0.035] md:text-9xl">
        01
      </span>

      <div className="relative grid gap-6 lg:min-h-[560px] lg:grid-cols-[1.18fr_0.82fr] lg:gap-8">
        <Link
          href={`/projects/${project.slug}`}
          aria-label={project.title}
          className="block h-full"
        >
          <ProjectCover
            src={project.coverImage}
            alt={project.title}
            fetchPriority="high"
            className="aspect-[16/11] h-full rounded-[1.55rem] border-brand-soft/20 shadow-[0_0_80px_rgba(139,92,246,0.18)] lg:aspect-auto"
            loading="eager"
          />
        </Link>

        <div className="flex min-w-0 flex-col justify-between p-3 md:p-5 lg:py-7 lg:pr-7">
          <div>
            <div className="mb-6 flex items-center justify-between gap-4">
              <Badge className="rounded-full bg-brand-soft px-4 py-1.5 text-primary-foreground">
                Featured Case Study
              </Badge>
              <span className="hidden text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase sm:inline">
                Selected Work
              </span>
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {project.techStack.slice(0, 5).map((tech) => (
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
              <h2 className="font-heading text-4xl leading-none font-semibold text-foreground transition-colors group-hover/project:text-brand-soft md:text-5xl lg:text-6xl">
                {project.title}
              </h2>
            </Link>
            <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
              {project.description ??
                "A selected project from Heinz's archive, focused on thoughtful implementation and polished interaction."}
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 border-y border-border/35 py-5">
              <div>
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Role
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Full-stack build
                </p>
              </div>
              <div>
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Focus
                </p>
                <p className="mt-2 font-medium text-foreground">
                  Interface polish
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link href={`/projects/${project.slug}`}>
                  Read case study
                  <ArrowUpRightIcon data-icon="inline-end" />
                </Link>
              </Button>

              {project.liveUrl && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-border/60 bg-surface/70"
                >
                  <Link href={project.liveUrl} target="_blank" rel="noreferrer">
                    Live site
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              )}

              {project.githubUrl && (
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
        </div>
      </div>
    </section>
  );
}
