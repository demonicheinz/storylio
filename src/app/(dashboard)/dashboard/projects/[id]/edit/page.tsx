import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProjectEditor } from "@/components/dashboard/project-editor";
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
      content: true,
      coverImage: true,
      screenshots: true,
      techStack: true,
      liveUrl: true,
      githubUrl: true,
      order: true,
      status: true,
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

  return (
    <ProjectEditor
      mode="edit"
      project={{
        id: project.id,
        title: project.title,
        slug: project.slug,
        description: project.description,
        content: project.content,
        coverImage: project.coverImage,
        screenshots: project.screenshots,
        techStack: project.techStack,
        liveUrl: project.liveUrl,
        githubUrl: project.githubUrl,
        order: project.order,
        status:
          project.status === ProjectStatus.PUBLISHED ? "published" : "draft",
      }}
    />
  );
}
