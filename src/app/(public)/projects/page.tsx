import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import styles from "@/components/public/public-page.module.css";
import { EmptyProjects } from "@/components/public/sections/projects/empty-projects";
import { ProjectFilters } from "@/components/public/sections/projects/project-filters";
import projectStyles from "@/components/public/sections/projects/projects.module.css";
import { ProjectsGrid } from "@/components/public/sections/projects/projects-grid";
import { ProjectsHero } from "@/components/public/sections/projects/projects-hero";
import { ProjectsPagination } from "@/components/public/sections/projects/projects-pagination";
import { normalizeProjectTechnologies } from "@/lib/project-filters";
import { getProjectPage } from "@/lib/project-pagination";
import { getPublicProjects } from "@/lib/public-projects";
import { SITE_NAME } from "@/lib/site";

type ProjectsPageProps = {
  searchParams: Promise<{
    tech?: string | string[] | undefined;
    page?: string | string[] | undefined;
  }>;
};

const metadata: Metadata = {
  title: "Projects — Storylio",
  description:
    "Selected web projects, full-stack builds, and interface experiments by Ahmad Haizul Amany.",
  openGraph: {
    siteName: SITE_NAME,
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

export async function generateMetadata({
  searchParams,
}: ProjectsPageProps): Promise<Metadata> {
  const query = await searchParams;
  const params = new URLSearchParams();
  const technologies = normalizeProjectTechnologies(query.tech);
  const { pagination } = await getPublicProjects(
    technologies,
    getProjectPage(query.page),
  );
  for (const technology of technologies) params.append("tech", technology);
  if (pagination.page > 1) params.set("page", String(pagination.page));
  const canonical = `/projects${params.size ? `?${params}` : ""}`;
  return {
    ...metadata,
    alternates: { canonical },
    openGraph: { ...metadata.openGraph, url: canonical },
  };
}

export default function ProjectsPage(props: ProjectsPageProps) {
  return (
    <PublicRouteBoundary variant="projects">
      <ProjectsContent {...props} />
    </PublicRouteBoundary>
  );
}

async function ProjectsContent({ searchParams }: ProjectsPageProps) {
  const query = await searchParams;
  const selectedTechnologies = normalizeProjectTechnologies(query.tech);
  const { projects, technologies, totalProjects, totalResults, pagination } =
    await getPublicProjects(selectedTechnologies, getProjectPage(query.page));

  return (
    <main className={styles.page} data-public-page="projects">
      <div className={styles.container}>
        <ProjectsHero />

        <Suspense fallback={<div className="border-border border-y h-20" />}>
          <ProjectFilters
            technologies={technologies}
            selectedTechnologies={selectedTechnologies}
            resultCount={totalResults}
            totalProjects={totalProjects}
          />
        </Suspense>

        <section
          id="projects-list"
          className={projectStyles.collection}
          aria-label="Project results"
          tabIndex={-1}
        >
          {projects.length > 0 ? (
            <ProjectsGrid projects={projects} />
          ) : (
            <EmptyProjects selectedTechnologies={selectedTechnologies} />
          )}
          <Suspense fallback={null}>
            <ProjectsPagination pagination={pagination} />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
