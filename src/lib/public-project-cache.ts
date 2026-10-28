import { and, arrayContains, asc, desc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import { ProjectStatus } from "@/lib/db/enums";
import { project } from "@/lib/db/schema";
import { PROJECTS_PER_PAGE } from "@/lib/project-pagination";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

function publishedProjects(selectedTechnologies: string[]) {
  return and(
    eq(project.status, ProjectStatus.PUBLISHED),
    selectedTechnologies.length
      ? arrayContains(project.techStack, selectedTechnologies)
      : undefined,
  );
}

export async function getProjectFacets() {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.projects);
  const facets = await db.query.project.findMany({
    where: eq(project.status, ProjectStatus.PUBLISHED),
    columns: { techStack: true },
  });
  return {
    technologies: [
      ...new Set(facets.flatMap((row) => row.techStack ?? [])),
    ].sort((a, b) => a.localeCompare(b)),
    totalProjects: facets.length,
  };
}

// Call through getPublicProjects so keys contain only canonical, known filters.
export async function getProjectCount(selectedTechnologies: string[]) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.projects);
  return db.$count(project, publishedProjects(selectedTechnologies));
}

export async function getProjectRows(
  selectedTechnologies: string[],
  page: number,
) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.projects);
  const rows = await db.query.project.findMany({
    where: publishedProjects(selectedTechnologies),
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
    // A unique final key keeps equal-ranked projects on stable pages.
    orderBy: [
      desc(project.isFeatured),
      asc(project.order),
      desc(project.createdAt),
      asc(project.id),
    ],
    limit: PROJECTS_PER_PAGE,
    offset: (page - 1) * PROJECTS_PER_PAGE,
  });
  return rows.map((row) => ({ ...row, techStack: row.techStack ?? [] }));
}
