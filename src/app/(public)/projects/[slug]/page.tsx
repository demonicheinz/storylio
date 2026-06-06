import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBackground } from "@/components/common";
import { ViewCounter } from "@/components/public/sections/blog";
import {
  ProjectCover,
  ProjectNavigation,
  ProjectScreenshots,
} from "@/components/public/sections/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { calculateReadingTime, formatDate } from "@/lib/utils";

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProjectBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");

  return db.project.findFirst({
    where: {
      slug,
      status: ProjectStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      content: true,
      coverImage: true,
      thumbnailImageUrl: true,
      ogImageUrl: true,
      techStack: true,
      liveUrl: true,
      githubUrl: true,
      order: true,
      isFeatured: true,
      isClosedSource: true,
      updatedAt: true,
      structuredScreenshots: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          imageUrl: true,
          caption: true,
          altText: true,
          width: true,
          height: true,
          aspectRatio: true,
          blurDataUrl: true,
          order: true,
        },
      },
    },
  });
}

async function getProjectNeighbors(projectId: string) {
  "use cache";
  cacheLife("minutes");

  const projects = await db.project.findMany({
    where: {
      status: ProjectStatus.PUBLISHED,
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      createdAt: true,
    },
    orderBy: [
      {
        order: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const currentIndex = projects.findIndex(
    (project) => project.id === projectId,
  );

  return {
    previousProject: currentIndex > 0 ? projects[currentIndex - 1] : undefined,
    nextProject:
      currentIndex >= 0 && currentIndex < projects.length - 1
        ? projects[currentIndex + 1]
        : undefined,
  };
}

export async function generateMetadata({
  params,
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    return {
      title: "Project Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    project.description ??
    `Read the project details for ${project.title} by Heinz on Storylio.`;
  const image =
    project.ogImageUrl ??
    project.coverImage ??
    `/og?title=${encodeURIComponent(project.title)}&type=project`;

  return {
    title: `${project.title} — Storylio`,
    description,
    openGraph: {
      title: `${project.title} — Storylio`,
      description,
      type: "article",
      siteName: "Storylio",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${project.title} — Storylio`,
      description,
      images: [image],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const [mdxContent, { previousProject, nextProject }] = await Promise.all([
    project.content ? renderMDX(project.content) : null,
    getProjectNeighbors(project.id),
  ]);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <ViewCounter type="project" slug={project.slug} />
      <PublicBackground variant="projects" />

      <article className="relative mx-auto flex w-full max-w-[1280px] flex-col px-4 pt-32 pb-24 sm:px-6 lg:px-8 lg:pt-40">
        <Button
          asChild
          variant="outline"
          className="mb-8 w-fit rounded-full border-border/60 bg-surface/70 backdrop-blur"
        >
          <Link href="/projects">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to projects
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <ProjectCover
              src={project.coverImage}
              alt={project.title}
              className="aspect-[16/11] shadow-[0_0_80px_rgba(139,92,246,0.14)]"
              fetchPriority="high"
              loading="eager"
            />
          </div>

          <div className="flex min-w-0 flex-col rounded-3xl border border-border/40 bg-surface/65 p-6 shadow-[0_0_64px_rgba(139,92,246,0.1)] backdrop-blur-xl md:p-8">
            <div className="mb-5 flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge
                  key={`${project.id}-${tech}`}
                  variant="outline"
                  className="rounded-full border-border/90 bg-background/35 text-foreground/85"
                >
                  {tech}
                </Badge>
              ))}
            </div>

            <h1 className="font-heading text-4xl leading-tight font-bold text-foreground md:text-6xl">
              {project.title}
            </h1>

            <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
              {project.description ??
                "A selected project from Heinz's archive, focused on thoughtful implementation and polished interaction."}
            </p>

            <div className="mt-8 grid gap-3 border-y border-border/40 py-5 sm:grid-cols-3">
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
                  Updated
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {formatDate(project.updatedAt)}
                </p>
              </div>
              <div>
                <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Read
                </p>
                <p className="mt-2 font-medium text-foreground">
                  {project.content
                    ? `${calculateReadingTime(project.content)} min`
                    : "Quick view"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {project.liveUrl && (
                <Button asChild className="rounded-full">
                  <Link href={project.liveUrl} target="_blank" rel="noreferrer">
                    Live site
                    <ArrowUpRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              )}

              {!project.isClosedSource && project.githubUrl && (
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-border/60 bg-surface/70"
                >
                  <Link
                    href={project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    GitHub
                    <GithubLogoIcon data-icon="inline-end" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {mdxContent && (
          <section className="mt-14 rounded-3xl border border-border/40 bg-surface/65 p-6 shadow-[0_0_64px_rgba(139,92,246,0.1)] backdrop-blur-xl md:p-8">
            <div className="prose-invert flex max-w-none flex-col gap-5">
              {mdxContent}
            </div>
          </section>
        )}

        <ProjectScreenshots
          structuredScreenshots={project.structuredScreenshots}
          title={project.title}
        />

        <ProjectNavigation
          previousProject={previousProject}
          nextProject={nextProject}
        />
      </article>
    </main>
  );
}
