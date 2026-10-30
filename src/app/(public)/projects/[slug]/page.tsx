import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  GithubLogoIcon,
} from "@phosphor-icons/react/dist/ssr";
import { and, asc, desc, eq } from "drizzle-orm";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FlowButton } from "@/components/common/flow-button";
import { PublicRouteBoundary } from "@/components/common/public-route-boundary";
import detailStyles from "@/components/public/public-detail.module.css";
import pageStyles from "@/components/public/public-page.module.css";
import reading from "@/components/public/reading.module.css";
import { ViewCounter } from "@/components/public/sections/blog/view-counter";
import { ProjectCover } from "@/components/public/sections/projects/project-cover";
import projectStyles from "@/components/public/sections/projects/project-detail.module.css";
import { ProjectNavigation } from "@/components/public/sections/projects/project-navigation";
import { ProjectScreenshots } from "@/components/public/sections/projects/project-screenshots";
import { ProjectToc } from "@/components/public/sections/projects/project-toc";
import { db } from "@/lib/db";
import { ProjectStatus } from "@/lib/db/enums";
import { IMAGE_QUALITY, PUBLIC_COVER_IMAGE_SIZES } from "@/lib/image-policy";
import { getProjectContribution } from "@/lib/project-contribution";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";
import { renderPublicMDX } from "@/lib/public-mdx";
import { calculateReadingTime, formatDate, slugify } from "@/lib/utils";

type ProjectDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function getProjectBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.projects);

  return db.query.project
    .findFirst({
      where: (table) =>
        and(eq(table.slug, slug), eq(table.status, ProjectStatus.PUBLISHED)),
      columns: {
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
      },
      with: {
        structuredScreenshots: {
          orderBy: (table) => [asc(table.order)],
          columns: {
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
    })
    .then((row) => (row ? { ...row, techStack: row.techStack ?? [] } : null));
}

async function getProjectNeighbors(projectId: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag(PUBLIC_CACHE_TAGS.projects);

  const projects = await db.query.project.findMany({
    where: (table) => eq(table.status, ProjectStatus.PUBLISHED),
    columns: {
      id: true,
      title: true,
      slug: true,
      description: true,
      order: true,
      createdAt: true,
    },
    orderBy: (table) => [asc(table.order), desc(table.createdAt)],
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

export default function ProjectDetailPage(props: ProjectDetailPageProps) {
  return (
    <PublicRouteBoundary variant="project-detail">
      <ProjectDetailContent {...props} />
    </PublicRouteBoundary>
  );
}

async function ProjectDetailContent({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  const [mdxContent, tocItems, { previousProject, nextProject }] =
    await Promise.all([
      project.content ? renderPublicMDX(project.content, "project") : null,
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
    <main className={pageStyles.page} data-public-page="project-detail">
      <ViewCounter type="project" slug={project.slug} />
      <article className={`${pageStyles.container} ${detailStyles.article}`}>
        <Link href="/projects" className={pageStyles.link}>
          <ArrowLeftIcon size={16} aria-hidden="true" /> Back to projects
        </Link>
        <div className={projectStyles.overview}>
          <header className={projectStyles.intro}>
            <h1 id="page-title" className={pageStyles.title}>
              {project.title}
            </h1>
            {project.description && (
              <p className={`${pageStyles.lede} ${detailStyles.description}`}>
                {project.description}
              </p>
            )}
          </header>
          {(project.liveUrl ||
            (!project.isClosedSource && project.githubUrl)) && (
            <div className={projectStyles.actions}>
              {project.liveUrl && (
                <FlowButton
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Live site
                </FlowButton>
              )}
              {!project.isClosedSource && project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={pageStyles.link}
                >
                  Source <GithubLogoIcon aria-hidden="true" size={18} />
                </a>
              )}
            </div>
          )}
          <div className={projectStyles.cover}>
            <ProjectCover
              src={project.coverImage}
              alt={project.title}
              className="aspect-video"
              fetchPriority="high"
              loading="eager"
              sizes={PUBLIC_COVER_IMAGE_SIZES}
              quality={IMAGE_QUALITY.detail}
            />
          </div>
          <dl className={projectStyles.facts}>
            <div>
              <dt>My part</dt>
              <dd>{contribution}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatDate(project.updatedAt)}</dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd>{readingTime}</dd>
            </div>
          </dl>
          {project.techStack.length > 0 && (
            <ul
              className={`${pageStyles.tags} ${projectStyles.stack}`}
              aria-label="Technology stack"
            >
              {project.techStack.map((tech) => (
                <li key={tech} className={pageStyles.tag}>
                  {tech}
                </li>
              ))}
            </ul>
          )}
        </div>
        {mdxContent && (
          <section
            aria-label="Project case study"
            className={pageStyles.section}
          >
            <div
              className={reading.layout}
              data-has-toc={tocItems.length > 0 || undefined}
            >
              <ProjectToc items={tocItems} />
              <div className={reading.prose}>{mdxContent}</div>
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
