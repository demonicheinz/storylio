"use server";

import { and, desc, eq, gt, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import {
  type ProjectActionInput,
  type ProjectActionValues,
  projectActionSchema,
  projectReorderSchema,
  type ScreenshotItemValues,
} from "@/features/dashboard/projects/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { ProjectStatus } from "@/lib/db/enums";
import { projectScreenshot, project as projectTable } from "@/lib/db/schema";
import { getMdxSafetyError } from "@/lib/mdx-safety";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type ProjectActionData = {
  id: string;
  slug: string;
  status: "draft" | "published";
};

const projectIdsSchema = z.array(z.string().min(1)).min(1).max(100);

function parseProjectInput(input: unknown) {
  const parsed = projectActionSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false as const,
      result: actionError(
        "Please fix the highlighted fields.",
        flattenFieldErrors(parsed.error.flatten().fieldErrors),
      ),
    };
  }

  return {
    success: true as const,
    data: parsed.data,
  };
}

function toProjectStatus(status: ProjectActionValues["status"]) {
  return status === "published" ? ProjectStatus.PUBLISHED : ProjectStatus.DRAFT;
}

function revalidateProjectPaths(slug: string, oldSlug?: string) {
  updateTag(PUBLIC_CACHE_TAGS.projects);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath(`/projects/${slug}`);

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/projects/${oldSlug}`);
  }
}

function revalidateProjectsCollection() {
  updateTag(PUBLIC_CACHE_TAGS.projects);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/");
}

function revalidateProjectSlugs(slugs: string[]) {
  revalidateProjectsCollection();

  for (const slug of slugs) {
    revalidatePath(`/projects/${slug}`);
  }
}

async function ensureUniqueSlug(slug: string, projectId?: string) {
  const existingProject = await db.query.project.findFirst({
    where: eq(projectTable.slug, slug),
    columns: { id: true },
  });

  if (existingProject && existingProject.id !== projectId) {
    return actionError("Slug is already used.", {
      slug: ["This slug is already used by another project."],
    });
  }

  return undefined;
}

async function getNextProjectOrder(tx: Transaction) {
  const lastItem = await tx.query.project.findFirst({
    orderBy: desc(projectTable.order),
    columns: { order: true },
  });
  return (lastItem?.order ?? -1) + 1;
}

async function prepareProjectCreateOrder(tx: Transaction, order: number) {
  if (order <= 0) return getNextProjectOrder(tx);
  await tx
    .update(projectTable)
    .set({ order: sql`${projectTable.order} + 1` })
    .where(gte(projectTable.order, order));
  return order;
}

async function moveProjectOrder(
  tx: Transaction,
  projectId: string,
  fromOrder: number,
  toOrder: number,
) {
  if (fromOrder === toOrder) return;
  if (toOrder < fromOrder) {
    await tx
      .update(projectTable)
      .set({ order: sql`${projectTable.order} + 1` })
      .where(
        and(
          ne(projectTable.id, projectId),
          gte(projectTable.order, toOrder),
          lt(projectTable.order, fromOrder),
        ),
      );
    return;
  }
  await tx
    .update(projectTable)
    .set({ order: sql`${projectTable.order} - 1` })
    .where(
      and(
        ne(projectTable.id, projectId),
        gt(projectTable.order, fromOrder),
        lte(projectTable.order, toOrder),
      ),
    );
}

function getProjectData(values: ProjectActionValues) {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description || null,
    contribution: values.contribution || null,
    content: values.content || null,
    coverImage: values.coverImage ?? null,
    thumbnailImageUrl: values.thumbnailImageUrl ?? null,
    ogImageUrl: values.ogImageUrl ?? null,
    techStack: values.techStack ?? [],
    liveUrl: values.liveUrl ?? null,
    githubUrl: values.githubUrl ?? null,
    order: values.order,
    status: toProjectStatus(values.status),
    isFeatured: values.isFeatured,
    isClosedSource: values.isClosedSource,
  };
}

function getScreenshotData(screenshot: ScreenshotItemValues) {
  return {
    imageUrl: screenshot.imageUrl,
    caption: screenshot.caption ?? null,
    altText: screenshot.altText ?? null,
    width: screenshot.width ?? null,
    height: screenshot.height ?? null,
    aspectRatio: screenshot.aspectRatio ?? null,
    blurDataUrl: screenshot.blurDataUrl ?? null,
    order: screenshot.order,
  };
}

export async function actionCreateProject(
  input: ProjectActionInput,
): Promise<ActionResult<ProjectActionData>> {
  let session: Awaited<ReturnType<typeof getActionSession>>;

  try {
    session = await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseProjectInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  const mdxError = await getMdxSafetyError(parsed.data.content);
  if (mdxError) {
    return actionError("Please fix the highlighted fields.", {
      content: [mdxError],
    });
  }

  try {
    const duplicateSlug = await ensureUniqueSlug(parsed.data.slug);
    if (duplicateSlug) {
      return duplicateSlug;
    }

    const project = await db.transaction(async (tx) => {
      const finalOrder = await prepareProjectCreateOrder(tx, parsed.data.order);
      const [savedProject] = await tx
        .insert(projectTable)
        .values({
          ...getProjectData(parsed.data),
          order: finalOrder,
          authorId: session.user.id,
        })
        .returning({
          id: projectTable.id,
          slug: projectTable.slug,
          status: projectTable.status,
        });
      if (!savedProject) throw new Error("Project not found.");
      const screenshots = parsed.data.structuredScreenshots ?? [];
      if (screenshots.length > 0) {
        await tx.insert(projectScreenshot).values(
          screenshots.map((s, i) => ({
            ...getScreenshotData(s),
            projectId: savedProject.id,
            order: s.order ?? i,
          })),
        );
      }
      return savedProject;
    });

    revalidateProjectPaths(project.slug);

    return actionSuccess(
      {
        id: project.id,
        slug: project.slug,
        status:
          project.status === ProjectStatus.PUBLISHED ? "published" : "draft",
      },
      project.status === ProjectStatus.PUBLISHED
        ? "Project published."
        : "Draft saved.",
    );
  } catch (error) {
    console.error("Create project failed:", error);
    return actionError("Failed to create project.");
  }
}

export async function actionUpdateProject(
  projectId: string,
  input: ProjectActionInput,
): Promise<ActionResult<ProjectActionData>> {
  return updateProject(projectId, input, false);
}

export async function actionAutosaveProject(
  input: ProjectActionInput,
  projectId: string,
): Promise<ActionResult<ProjectActionData>> {
  return updateProject(projectId, input, true);
}

async function updateProject(
  projectId: string,
  input: ProjectActionInput,
  preservePublication: boolean,
): Promise<ActionResult<ProjectActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseProjectInput(
    preservePublication ? { ...input, status: "draft" } : input,
  );
  if (!parsed.success) {
    return parsed.result;
  }

  const mdxError = await getMdxSafetyError(parsed.data.content);
  if (mdxError) {
    return actionError("Please fix the highlighted fields.", {
      content: [mdxError],
    });
  }

  try {
    const existingProject = await db.query.project.findFirst({
      where: eq(projectTable.id, projectId),
      columns: {
        id: true,
        slug: true,
        order: true,
        status: true,
      },
    });

    if (!existingProject) {
      return actionError("Project not found.");
    }

    if (
      preservePublication &&
      existingProject.status === ProjectStatus.PUBLISHED &&
      !parsed.data.content.trim()
    ) {
      return actionError("Please fix the highlighted fields.", {
        content: ["Content is required before publishing"],
      });
    }

    const duplicateSlug = await ensureUniqueSlug(parsed.data.slug, projectId);
    if (duplicateSlug) {
      return duplicateSlug;
    }

    const project = await db.transaction(async (tx) => {
      await moveProjectOrder(
        tx,
        projectId,
        existingProject.order,
        parsed.data.order,
      );
      // Delete all existing screenshots, then recreate.
      await tx
        .delete(projectScreenshot)
        .where(eq(projectScreenshot.projectId, projectId));
      const screenshots = parsed.data.structuredScreenshots ?? [];
      if (screenshots.length > 0) {
        await tx.insert(projectScreenshot).values(
          screenshots.map((s, i) => ({
            ...getScreenshotData(s),
            projectId,
            order: s.order ?? i,
          })),
        );
      }
      const [savedProject] = await tx
        .update(projectTable)
        .set({
          ...getProjectData(parsed.data),
          // Undefined columns are omitted by Drizzle, preserving the stored status.
          ...(preservePublication ? { status: undefined } : {}),
        })
        // Check at the write so a publish in another tab cannot accept blank live content.
        .where(
          and(
            eq(projectTable.id, projectId),
            preservePublication && !parsed.data.content.trim()
              ? eq(projectTable.status, ProjectStatus.DRAFT)
              : undefined,
          ),
        )
        .returning({
          id: projectTable.id,
          slug: projectTable.slug,
          status: projectTable.status,
        });
      if (!savedProject) throw new Error("Project not found.");
      return savedProject;
    });

    revalidateProjectPaths(project.slug, existingProject.slug);

    return actionSuccess(
      {
        id: project.id,
        slug: project.slug,
        status:
          project.status === ProjectStatus.PUBLISHED ? "published" : "draft",
      },
      project.status === ProjectStatus.PUBLISHED
        ? "Project published."
        : "Draft saved.",
    );
  } catch (error) {
    console.error("Update project failed:", error);
    return actionError("Failed to update project.");
  }
}

export async function actionDeleteProject(
  projectId: string,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const project = await db.query.project.findFirst({
      where: eq(projectTable.id, projectId),
      columns: { slug: true },
    });

    if (!project) {
      return actionError("Project not found.");
    }

    await db.delete(projectTable).where(eq(projectTable.id, projectId));

    revalidateProjectPaths(project.slug);

    return actionSuccess(undefined, "Project deleted.");
  } catch (error) {
    console.error("Delete project failed:", error);
    return actionError("Failed to delete project.");
  }
}

function parseProjectIds(projectIds: string[]) {
  const parsed = projectIdsSchema.safeParse(projectIds);

  if (!parsed.success) {
    return actionError("Select at least one project.");
  }

  return parsed.data;
}

export async function actionPublishProjects(
  projectIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseProjectIds(projectIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    let slugs: string[] = [];
    const outcome = await db.transaction(async (tx) => {
      const rows = await tx
        .select()
        .from(projectTable)
        .where(inArray(projectTable.id, parsedIds))
        .for("update");
      if (rows.length !== new Set(parsedIds).size)
        return actionError(
          "The selection changed. Refresh and select the projects again. Nothing was published.",
        );
      for (const row of rows.filter(
        (entry) => entry.status === ProjectStatus.DRAFT,
      )) {
        const input = Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            value === null ? undefined : value,
          ]),
        );
        const parsed = projectActionSchema.safeParse({
          ...input,
          status: "published",
          techStack: row.techStack ?? [],
        });
        const problem = !parsed.success
          ? parsed.error.issues[0]?.message
          : await getMdxSafetyError(parsed.data.content);
        if (problem)
          return actionError(
            `Cannot publish "${row.title}": ${problem} No projects were published.`,
          );
      }
      const changed = await tx
        .update(projectTable)
        .set({ status: ProjectStatus.PUBLISHED, updatedAt: new Date() })
        .where(
          and(
            inArray(projectTable.id, parsedIds),
            eq(projectTable.status, ProjectStatus.DRAFT),
          ),
        )
        .returning({ id: projectTable.id });
      slugs = rows.map((entry) => entry.slug);
      return actionSuccess(
        { count: changed.length },
        changed.length === 1
          ? "Project published."
          : `${changed.length} projects published.`,
      );
    });
    if (outcome.success) revalidateProjectSlugs(slugs);
    return outcome;
  } catch (error) {
    console.error("Publish projects failed:", error);
    return actionError("Failed to publish projects.");
  }
}

export async function actionMoveProjectsToDraft(
  projectIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseProjectIds(projectIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    const projects = await db.query.project.findMany({
      where: inArray(projectTable.id, parsedIds),
      columns: { slug: true },
    });

    const result = await db
      .update(projectTable)
      .set({
        status: ProjectStatus.DRAFT,
      })
      .where(
        and(
          inArray(projectTable.id, parsedIds),
          eq(projectTable.status, ProjectStatus.PUBLISHED),
        ),
      )
      .returning({ id: projectTable.id });

    revalidateProjectSlugs(projects.map((project) => project.slug));

    return actionSuccess(
      { count: result.length },
      result.length === 1
        ? "Project moved to draft."
        : `${result.length} projects moved to draft.`,
    );
  } catch (error) {
    console.error("Move projects to draft failed:", error);
    return actionError("Failed to move projects to draft.");
  }
}

export async function actionDeleteProjects(
  projectIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseProjectIds(projectIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    const projects = await db.query.project.findMany({
      where: inArray(projectTable.id, parsedIds),
      columns: { slug: true },
    });

    const result = await db
      .delete(projectTable)
      .where(inArray(projectTable.id, parsedIds))
      .returning({ id: projectTable.id });

    revalidateProjectSlugs(projects.map((project) => project.slug));

    return actionSuccess(
      { count: result.length },
      result.length === 1
        ? "Project deleted."
        : `${result.length} projects deleted.`,
    );
  } catch (error) {
    console.error("Delete projects failed:", error);
    return actionError("Failed to delete projects.");
  }
}

export async function actionPublishProject(
  input: ProjectActionInput,
  projectId?: string,
): Promise<ActionResult<ProjectActionData>> {
  const values = {
    ...input,
    status: "published",
  } satisfies ProjectActionInput;

  if (projectId) {
    return actionUpdateProject(projectId, values);
  }

  return actionCreateProject(values);
}

export async function actionSaveProjectDraft(
  input: ProjectActionInput,
  projectId?: string,
): Promise<ActionResult<ProjectActionData>> {
  const values = {
    ...input,
    status: "draft",
  } satisfies ProjectActionInput;

  if (projectId) {
    return actionUpdateProject(projectId, values);
  }

  return actionCreateProject(values);
}

export async function actionReorderProjects(
  input: unknown,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = projectReorderSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid project order.");
  }

  try {
    const projects = await db.transaction(async (tx) => {
      const updatedProjects: { slug: string }[] = [];
      for (const item of parsed.data) {
        const [updatedProject] = await tx
          .update(projectTable)
          .set({ order: item.order })
          .where(eq(projectTable.id, item.id))
          .returning({ slug: projectTable.slug });
        if (!updatedProject) throw new Error("Project not found.");
        updatedProjects.push(updatedProject);
      }
      return updatedProjects;
    });

    revalidatePath("/dashboard/projects");
    revalidatePath("/dashboard");
    revalidatePath("/projects");
    revalidatePath("/");

    for (const project of projects) {
      revalidatePath(`/projects/${project.slug}`);
    }

    return actionSuccess(undefined, "Project order updated.");
  } catch (error) {
    console.error("Reorder projects failed:", error);
    return actionError("Failed to reorder projects.");
  }
}
