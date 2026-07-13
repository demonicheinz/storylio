import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  EyeSlashIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PublicBackground } from "@/components/common";
import {
  ProjectCover,
  ProjectScreenshots,
  ProjectToc,
} from "@/components/public/sections/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProjectStatus } from "@/generated/prisma";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { renderMDX } from "@/lib/mdx";
import { getProjectContribution } from "@/lib/project-contribution";
import { calculateReadingTime, formatDate, slugify } from "@/lib/utils";

type PreviewProjectPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const metadata: Metadata = {
  title: "Project Preview — Storylio",
  robots: {
    index: false,
    follow: false,
  },
};

async function requirePreviewSession() {
  try {
    await getActionSession();
  } catch {
    redirect("/sign-in");
  }
}

async function getPreviewProject(slug: string) {
  return db.project.findFirst({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      contribution: true,
      content: true,
      coverImage: true,
      techStack: true,
      liveUrl: true,
      githubUrl: true,
      isClosedSource: true,
      status: true,
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

export default async function PreviewProjectPage({
  params,
}: PreviewProjectPageProps) {
  await requirePreviewSession();

  const { slug } = await params;
  const project = await getPreviewProject(slug);

  if (!project) {
    notFound();
  }

  const content = project.content ?? "";
  const [mdxContent, tocItems] = await Promise.all([
    content ? renderMDX(content) : Promise.resolve(null),
    Promise.resolve(content ? getProjectTocItems(content) : []),
  ]);
  const contribution =
    project.contribution ?? getProjectContribution(project.techStack);
  const readingTime = content
    ? `${calculateReadingTime(content)} min read`
    : "Quick view";
  const isPublished = project.status === ProjectStatus.PUBLISHED;

  return (
    <main className="min-h-screen overflow-x-clip">
      <PublicBackground variant="projects" />

      <article className="relative flex flex-col mx-auto px-4 sm:px-6 lg:px-8 pt-32 lg:pt-40 pb-24 w-full max-w-7xl">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
          <Button
            asChild
            variant="outline"
            className="bg-surface/70 backdrop-blur border-border/60 rounded-full"
          >
            <Link href={`/dashboard/projects/${project.id}/edit`}>
              <ArrowLeftIcon data-icon="inline-start" />
              Back to editor
            </Link>
          </Button>

          <div className="inline-flex items-center gap-2 bg-brand-soft/10 px-3 py-1.5 border border-brand-soft/30 rounded-full font-medium text-brand-soft text-xs">
            <EyeSlashIcon className="size-4" />
            Preview mode
            <span className="text-border" aria-hidden="true">
              /
            </span>
            {isPublished ? "Published" : "Draft"}
          </div>
        </div>

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
          <section
            aria-label="Project preview case study"
            className="mt-16 md:mt-24"
          >
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
      </article>
    </main>
  );
}
