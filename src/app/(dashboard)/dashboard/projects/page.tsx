import { asc, desc } from "drizzle-orm";
import { connection } from "next/server";
import { ProjectsManager } from "@/features/dashboard/projects/components/projects-manager";
import { db } from "@/lib/db";

async function getProjects() {
  return db.query.project
    .findMany({
      orderBy: (table) => [asc(table.order), desc(table.updatedAt)],
      columns: {
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
    })
    .then((rows) =>
      rows.map((row) => ({ ...row, techStack: row.techStack ?? [] })),
    );
}

export default async function ProjectsPage() {
  await connection();

  const projects = await getProjects();

  return <ProjectsManager projects={projects} />;
}
