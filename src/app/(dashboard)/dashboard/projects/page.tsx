import { BriefcaseIcon, PlusIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { connection } from "next/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectSortableList } from "@/features/dashboard/projects/components/project-sortable-list";
import { db } from "@/lib/db";

async function getProjects() {
  return db.project.findMany({
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-muted-foreground">
            Manage portfolio drafts, published case studies, media, and display
            order.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <PlusIcon data-icon="inline-start" />
            New Project
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Portfolio Projects</CardTitle>
          <CardDescription>
            {projects.length} {projects.length === 1 ? "project" : "projects"}{" "}
            in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
              <BriefcaseIcon className="size-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No projects yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create the first portfolio entry and keep it as a draft until
                  it is ready.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/projects/new">
                  <PlusIcon data-icon="inline-start" />
                  New Project
                </Link>
              </Button>
            </div>
          ) : (
            <ProjectSortableList projects={projects} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
