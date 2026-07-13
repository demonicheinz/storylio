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
  ProjectToc,
} from "@/components/public/sections/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { getProjectContribution } from "@/lib/project-contribution";
import { calculateReadingTime, formatDate, slugify } from "@/lib/utils";

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
      contribution: true,
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

function getProjectTocItems(content: string) {
  const headings = content.matchAll(/^(##|###)\s+(.+)$/gm);
  const seenIds = new Map<string, number>();

  return Array.from(headings).map((heading) => {
    const level: 2 | 3 = heading[1] === "###" ? 3 : 2;
    const title = heading[2].replace(/[#*_`]/g, "").trim();
    const baseId = slugify(title);
    const count = seenIds.get(baseId) ?? 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;

    seenIds.set(baseId, count + 1);

    return {
      id,
      title,
      level,
    };
  });
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

  const [mdxContent, tocItems, { previousProject, nextProject }] =
    await Promise.all([
      project.content ? renderMDX(project.content) : null,
      Promise.resolve(
        project.content ? getProjectTocItems(project.content) : [],
      ),
      getProjectNeighbors(project.id),
    ]);
  const contribution =
    project.contribution ?? getProjectContribution(project.techStack);
  const readingTime = project.content
    ? `${calculateReadingTime(project.content)} min read`
    : "Quick view";

  return (
    <main className="min-h-screen overflow-x-clip">
      <ViewCounter type="project" slug={project.slug} />
      <PublicBackground variant="projects" />

      <article className="relative flex flex-col mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-24 w-full max-w-7xl">
        <Button
          asChild
          variant="outline"
          className="bg-surface/70 backdrop-blur mb-8 border-border/60 rounded-full w-fit"
        >
          <Link href="/projects">
            <ArrowLeftIcon data-icon="inline-start" />
            Back to projects
          </Link>
        </Button>

        <div className="lg:items-start gap-6 md:gap-8 grid lg:grid-cols-[1.08fr_0.92fr]">
          <div className="lg:top-28 lg:sticky">
            <ProjectCover
              src={project.coverImage}
              alt={project.title}
              className="shadow-[0_0_80px_rgba(139,92,246,0.14)] aspect-video"
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 52vw, calc(100vw - 2rem)"
            />
          </div>

          <div className="flex flex-col bg-surface/65 shadow-[0_0_64px_rgba(139,92,246,0.1)] backdrop-blur-xl p-6 md:p-8 lg:p-9 border border-border/40 rounded-3xl min-w-0">
            <div className="flex flex-wrap gap-1.5 mb-6">
              {project.techStack.map((tech) => (
                <Badge
                  key={`${project.id}-${tech}`}
                  variant="outline"
                  className="bg-background/35 border-border/90 rounded-full text-foreground/85"
                >
                  {tech}
                </Badge>
              ))}
            </div>

            <h1 className="font-heading font-bold text-foreground text-4xl md:text-5xl xl:text-6xl leading-[1.08]">
              {project.title}
            </h1>

            <p className="mt-6 text-muted-foreground text-base md:text-lg leading-8">
              {project.description ??
                "A selected project from Heinz's archive, focused on thoughtful implementation and polished interaction."}
            </p>

            <div className="sm:hidden mt-8 py-5 border-border/40 border-y">
              <p className="font-medium text-foreground">{contribution}</p>
              <p className="mt-1.5 text-muted-foreground text-sm">
                {formatDate(project.updatedAt)}
                <span className="px-2 text-border" aria-hidden="true">
                  •
                </span>
                {readingTime}
              </p>
            </div>

            <dl className="hidden gap-4 sm:grid sm:grid-cols-3 mt-9 py-6 border-border/40 border-y">
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  Contribution
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {contribution}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  Updated
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {formatDate(project.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  Read
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {readingTime.replace(" read", "")}
                </dd>
              </div>
            </dl>

            <div className="flex flex-wrap gap-3 mt-7">
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
                  className="bg-surface/70 border-border/60 rounded-full"
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
          <section aria-label="Project case study" className="mt-16 md:mt-24">
            <div className="mb-10 max-w-3xl">
              <p className="font-semibold text-brand-soft text-xs uppercase tracking-[0.28em]">
                Inside the project
              </p>
              <h2 className="mt-3 font-heading font-semibold text-foreground text-3xl md:text-4xl">
                From intent to outcome
              </h2>
              <p className="mt-4 max-w-2xl text-muted-foreground text-base leading-8">
                A closer look at the thinking, implementation, and decisions
                that shaped the final work.
              </p>
            </div>

            <div className="items-start gap-10 grid xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="flex flex-col gap-6 prose-invert [&>h2:first-child]:mt-0 [&>h2]:mt-20 [&>h3]:mt-12 [&>h2:first-child]:pt-0 [&>h2]:pt-2 pl-5 sm:pl-8 lg:pl-10 border-border/30 border-l min-w-0 max-w-4xl">
                {mdxContent}
              </div>

              <ProjectToc items={tocItems} />
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
