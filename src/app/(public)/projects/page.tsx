import { and, arrayContains, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { PublicBackground } from "@/components/common";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import {
  EmptyProjects,
  FeaturedProject,
  ProjectFilters,
  ProjectReveal,
  ProjectsGrid,
  ProjectsHero,
} from "@/components/public/sections/projects";
import { db } from "@/lib/db";
import { ProjectStatus } from "@/lib/db/enums";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

type ProjectsPageProps = {
  searchParams: Promise<{
    tech?: string | string[] | undefined;
  }>;
};

export const metadata: Metadata = {
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
  cacheTag(PUBLIC_CACHE_TAGS.projects);

  const [projects, allPublishedProjects] = await Promise.all([
    db.query.project
      .findMany({
        where: (table) =>
          and(
            eq(table.status, ProjectStatus.PUBLISHED),
            selectedTech
              ? arrayContains(table.techStack, [selectedTech])
              : undefined,
          ),
        columns: {
          id: true,
          title: true,
          slug: true,
          description: true,
          contribution: true,
          coverImage: true,
          thumbnailImageUrl: true,
          isFeatured: true,
          isClosedSource: true,
          techStack: true,
          liveUrl: true,
          githubUrl: true,
          order: true,
        },
        orderBy: (table) => [asc(table.order), desc(table.createdAt)],
      })
      .then((rows) =>
        rows.map((row) => ({ ...row, techStack: row.techStack ?? [] })),
      ),
    db.query.project
      .findMany({
        where: (table) => eq(table.status, ProjectStatus.PUBLISHED),
        columns: { id: true, techStack: true },
        orderBy: (table) => [asc(table.order), desc(table.createdAt)],
      })
      .then((rows) =>
        rows.map((row) => ({ ...row, techStack: row.techStack ?? [] })),
      ),
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

export default function ProjectsPage(props: ProjectsPageProps) {
  return (
    <PublicRouteBoundary>
      <ProjectsContent {...props} />
    </PublicRouteBoundary>
  );
}

async function ProjectsContent({ searchParams }: ProjectsPageProps) {
  const selectedTech = getSelectedTech((await searchParams).tech);
  const { projects, technologies, totalProjects } =
    await getProjectsData(selectedTech);
  const featuredProject = projects.find((project) => project.isFeatured);
  const remainingProjects = featuredProject
    ? projects.filter((project) => project.id !== featuredProject.id)
    : projects;

  return (
    <main className="min-h-screen overflow-x-hidden">
      <PublicBackground variant="projects" />

      <div className="relative flex flex-col mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-295">
        <ProjectsHero
          totalProjects={totalProjects}
          totalTech={technologies.length}
          selectedTech={selectedTech}
        />

        <Suspense
          fallback={
            <div className="bg-surface/55 backdrop-blur-xl border border-border/40 rounded-3xl h-24" />
          }
        >
          <ProjectFilters
            technologies={technologies}
            selectedTech={selectedTech}
          />
        </Suspense>

        <div className="flex flex-wrap justify-between items-center gap-3 mt-4 px-1 text-muted-foreground text-sm">
          <p>{formatProjectsSummary(projects.length, selectedTech)}</p>
          {selectedTech && (
            <Link
              href="/projects"
              scroll={false}
              className="text-brand-soft hover:text-foreground hover:underline underline-offset-4 transition-colors"
            >
              Reset stack
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-7 md:gap-8 pt-8 md:pt-10 pb-12 md:pb-14">
          {projects.length > 0 ? (
            <>
              {featuredProject && (
                <ProjectReveal>
                  <FeaturedProject project={featuredProject} />
                </ProjectReveal>
              )}

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
