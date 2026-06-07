import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PublicBackground } from "@/components/common";
import {
  EmptyProjects,
  FeaturedProject,
  ProjectFilters,
  ProjectReveal,
  ProjectsGrid,
  ProjectsHero,
} from "@/components/public/sections/projects";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type ProjectsPageProps = {
  searchParams: Promise<{
    tech?: string | string[] | undefined;
  }>;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Projects — Storylio",
    description:
      "Selected web projects, full-stack builds, and interface experiments by Ahmad Haizul Amany.",
    openGraph: {
      title: "Projects — Storylio",
      description:
        "Browse selected works from Heinz: polished interfaces, full-stack systems, and web experiments.",
      type: "website",
      images: ["/og?title=Projects&type=page"],
    },
    twitter: {
      card: "summary_large_image",
      title: "Projects — Storylio",
      description:
        "Selected web projects, full-stack builds, and interface experiments by Ahmad Haizul Amany.",
      images: ["/og?title=Projects&type=page"],
    },
  };
}

function getSelectedTech(value: string | string[] | undefined) {
  const tech = Array.isArray(value) ? value[0] : value;

  return tech?.trim() || undefined;
}

function formatProjectsSummary(projectsCount: number, selectedTech?: string) {
  const noun = projectsCount === 1 ? "project" : "projects";

  if (selectedTech) {
    return `Showing ${projectsCount} ${noun} using ${selectedTech}`;
  }

  return `Showing ${projectsCount} ${noun} across all stacks`;
}

async function getProjectsData(selectedTech?: string) {
  "use cache";
  cacheLife("minutes");

  const [projects, allPublishedProjects] = await Promise.all([
    db.project.findMany({
      where: {
        status: ProjectStatus.PUBLISHED,
        ...(selectedTech
          ? {
              techStack: {
                has: selectedTech,
              },
            }
          : {}),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        thumbnailImageUrl: true,
        isFeatured: true,
        isClosedSource: true,
        techStack: true,
        liveUrl: true,
        githubUrl: true,
        order: true,
      },
      orderBy: [
        {
          isFeatured: "desc",
        },
        {
          order: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
    }),
    db.project.findMany({
      where: {
        status: ProjectStatus.PUBLISHED,
      },
      select: {
        id: true,
        techStack: true,
      },
      orderBy: [{ isFeatured: "desc" }, { order: "asc" }],
    }),
  ]);

  const technologies = Array.from(
    new Set(allPublishedProjects.flatMap((project) => project.techStack)),
  ).sort((a, b) => a.localeCompare(b));

  return {
    projects,
    technologies,
    totalProjects: allPublishedProjects.length,
  };
}

export default async function ProjectsPage({
  searchParams,
}: ProjectsPageProps) {
  const selectedTech = getSelectedTech((await searchParams).tech);
  const { projects, technologies, totalProjects } =
    await getProjectsData(selectedTech);
  const [featuredProject, ...remainingProjects] = projects;

  return (
    <main className="min-h-screen overflow-x-hidden">
      <PublicBackground variant="projects" />

      <div className="relative mx-auto flex w-full max-w-[1180px] flex-col px-4 sm:px-6 lg:px-8">
        <ProjectsHero
          totalProjects={totalProjects}
          totalTech={technologies.length}
          selectedTech={selectedTech}
        />

        <Suspense
          fallback={
            <div className="h-24 rounded-3xl border border-border/40 bg-surface/55 backdrop-blur-xl" />
          }
        >
          <ProjectFilters
            technologies={technologies}
            selectedTech={selectedTech}
          />
        </Suspense>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p>{formatProjectsSummary(projects.length, selectedTech)}</p>
          {selectedTech && (
            <Link
              href="/projects"
              scroll={false}
              className="text-brand-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Reset stack
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-8 py-10 md:py-12">
          {featuredProject ? (
            <>
              <ProjectReveal>
                <FeaturedProject project={featuredProject} />
              </ProjectReveal>

              {remainingProjects.length > 0 && (
                <ProjectsGrid projects={remainingProjects} />
              )}
            </>
          ) : (
            <EmptyProjects selectedTech={selectedTech} />
          )}
        </div>
      </div>

      <div className="h-24" />
    </main>
  );
}
