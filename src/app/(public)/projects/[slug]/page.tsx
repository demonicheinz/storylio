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

      <article className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pt-32 pb-24 sm:px-6 lg:px-8 lg:pt-40">
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

        <div className="grid gap-6 md:gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <ProjectCover
              src={project.coverImage}
              alt={project.title}
              className="aspect-video shadow-[0_0_80px_rgba(139,92,246,0.14)]"
              fetchPriority="high"
              loading="eager"
              sizes="(min-width: 1280px) 640px, (min-width: 1024px) 52vw, calc(100vw - 2rem)"
            />
          </div>

          <div className="flex min-w-0 flex-col rounded-3xl border border-border/40 bg-surface/65 p-6 shadow-[0_0_64px_rgba(139,92,246,0.1)] backdrop-blur-xl md:p-8 lg:p-9">
            <div className="mb-6 flex flex-wrap gap-1.5">
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

            <h1 className="font-heading text-4xl leading-[1.08] font-bold text-foreground md:text-5xl xl:text-6xl">
              {project.title}
            </h1>

            <p className="mt-6 text-base leading-8 text-muted-foreground md:text-lg">
              {project.description ??
                "A selected project from Heinz's archive, focused on thoughtful implementation and polished interaction."}
            </p>

            <div className="mt-8 border-y border-border/40 py-5 sm:hidden">
              <p className="font-medium text-foreground">{contribution}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {formatDate(project.updatedAt)}
                <span className="px-2 text-border" aria-hidden="true">
                  •
                </span>
                {readingTime}
              </p>
            </div>

            <dl className="mt-9 hidden gap-4 border-y border-border/40 py-6 sm:grid sm:grid-cols-3">
              <div>
                <dt className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Contribution
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {contribution}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Updated
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {formatDate(project.updatedAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
                  Read
                </dt>
                <dd className="mt-2 font-medium text-foreground">
                  {readingTime.replace(" read", "")}
                </dd>
              </div>
            </dl>

            <div className="mt-7 flex flex-wrap gap-3">
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
          <section aria-label="Project case study" className="mt-16 md:mt-24">
            <div className="mb-10 max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.28em] text-brand-soft uppercase">
                Inside the project
              </p>
              <h2 className="mt-3 font-heading text-3xl font-semibold text-foreground md:text-4xl">
                From intent to outcome
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
                A closer look at the thinking, implementation, and decisions
                that shaped the final work.
              </p>
            </div>

            <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="prose-invert flex max-w-4xl min-w-0 flex-col gap-6 border-l border-border/30 pl-5 sm:pl-8 lg:pl-10 [&>h2]:mt-20 [&>h2]:pt-2 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h3]:mt-12">
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
