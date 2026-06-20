import { connection } from "next/server";
import { ProjectsManager } from "@/features/dashboard/projects/components/projects-manager";
import { db } from "@/lib/db";

async function getProjects() {
  return db.project.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      thumbnailImageUrl: true,
      isFeatured: true,
      status: true,
      techStack: true,
      order: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export default async function ProjectsPage() {
  await connection();

  const projects = await getProjects();

  return <ProjectsManager projects={projects} />;
}
