import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProjectEditor } from "@/features/dashboard/projects/components/project-editor";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type EditProjectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getProject(id: string) {
  return db.project.findUnique({
    where: { id },
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
      status: true,
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

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  await connection();

  const { id } = await params;
  const project = await getProject(id);

  if (!project) {
    notFound();
  }

  // Map structured screenshots to ScreenshotItemInput format
  const structuredScreenshots = project.structuredScreenshots.map((s) => ({
    id: s.id,
    imageUrl: s.imageUrl,
    caption: s.caption ?? undefined,
    altText: s.altText ?? undefined,
    width: s.width ?? undefined,
    height: s.height ?? undefined,
    aspectRatio: s.aspectRatio ?? undefined,
    blurDataUrl: s.blurDataUrl ?? undefined,
    order: s.order,
  }));

  return (
    <ProjectEditor
      mode="edit"
      project={{
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        contribution: project.contribution,
        content: project.content,
        coverImage: project.coverImage,
        thumbnailImageUrl: project.thumbnailImageUrl,
        ogImageUrl: project.ogImageUrl,
        structuredScreenshots,
        techStack: project.techStack,
        liveUrl: project.liveUrl,
        githubUrl: project.githubUrl,
        order: project.order,
        isFeatured: project.isFeatured,
        isClosedSource: project.isClosedSource,
        status:
          project.status === ProjectStatus.PUBLISHED ? "published" : "draft",
      }}
    />
  );
}
