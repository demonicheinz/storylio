import {
  ArrowSquareOutIcon,
  BriefcaseIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { connection } from "next/server";
import { ProjectDeleteButton } from "@/components/dashboard/project-delete-button";
import { ProjectReorderButton } from "@/components/dashboard/project-reorder-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

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
            <div className="flex flex-col gap-3">
              {projects.map((project, index) => {
                const isPublished = project.status === ProjectStatus.PUBLISHED;
                const previousProject = projects[index - 1];
                const nextProject = projects[index + 1];

                return (
                  <div
                    key={project.id}
                    className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-heading text-lg font-semibold">
                          {project.title}
                        </h2>
                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {isPublished ? "published" : "draft"}
                        </Badge>
                        <Badge variant="outline">order {project.order}</Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        /projects/{project.slug}
                      </p>
                      {project.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {project.description}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>Updated {formatDate(project.updatedAt)}</span>
                        <span>Created {formatDate(project.createdAt)}</span>
                        {project.techStack.slice(0, 4).map((tech) => (
                          <Badge
                            key={tech}
                            variant="outline"
                            className="text-[11px]"
                          >
                            {tech}
                          </Badge>
                        ))}
                        {project.techStack.length > 4 && (
                          <span>+{project.techStack.length - 4} more</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <div className="flex items-center gap-1">
                        <ProjectReorderButton
                          direction="up"
                          disabled={!previousProject}
                          updates={
                            previousProject
                              ? [
                                  {
                                    id: project.id,
                                    order: previousProject.order,
                                  },
                                  {
                                    id: previousProject.id,
                                    order: project.order,
                                  },
                                ]
                              : []
                          }
                        />
                        <ProjectReorderButton
                          direction="down"
                          disabled={!nextProject}
                          updates={
                            nextProject
                              ? [
                                  {
                                    id: project.id,
                                    order: nextProject.order,
                                  },
                                  {
                                    id: nextProject.id,
                                    order: project.order,
                                  },
                                ]
                              : []
                          }
                        />
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          href={`/projects/${project.slug}`}
                          target="_blank"
                        >
                          <ArrowSquareOutIcon data-icon="inline-start" />
                          Preview
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/projects/${project.id}/edit`}>
                          <PencilSimpleIcon data-icon="inline-start" />
                          Edit
                        </Link>
                      </Button>
                      <ProjectDeleteButton
                        projectId={project.id}
                        title={project.title}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
