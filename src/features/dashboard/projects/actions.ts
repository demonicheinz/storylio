"use server";

import { revalidatePath } from "next/cache";
import {
  type ProjectActionInput,
  type ProjectActionValues,
  projectActionSchema,
  projectReorderSchema,
  type ScreenshotItemValues,
} from "@/features/dashboard/projects/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import { ProjectStatus } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { getMdxSafetyError } from "@/lib/mdx-safety";

type ProjectActionData = {
  id: string;
  slug: string;
  status: "draft" | "published";
};

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
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/");
  revalidatePath(`/projects/${slug}`);

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/projects/${oldSlug}`);
  }
}

async function ensureUniqueSlug(slug: string, projectId?: string) {
  const existingProject = await db.project.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingProject && existingProject.id !== projectId) {
    return actionError("Slug is already used.", {
      slug: ["This slug is already used by another project."],
    });
  }

  return undefined;
}

async function getNextProjectOrder() {
  const lastProject = await db.project.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastProject?.order ?? -1) + 1;
}

async function prepareProjectCreateOrder(order: number) {
  if (order <= 0) {
    return getNextProjectOrder();
  }

  await db.project.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });

  return order;
}

async function moveProjectOrder(
  projectId: string,
  fromOrder: number,
  toOrder: number,
) {
  if (fromOrder === toOrder) {
    return;
  }

  if (toOrder < fromOrder) {
    await db.project.updateMany({
      where: {
        id: { not: projectId },
        order: {
          gte: toOrder,
          lt: fromOrder,
        },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await db.project.updateMany({
    where: {
      id: { not: projectId },
      order: {
        gt: fromOrder,
        lte: toOrder,
      },
    },
    data: { order: { decrement: 1 } },
  });
}

function getProjectData(values: ProjectActionValues) {
  return {
    title: values.title,
    slug: values.slug,
    description: values.description || null,
    content: values.content || null,
    coverImage: values.coverImage ?? null,
    thumbnailImageUrl: values.thumbnailImageUrl ?? null,
    ogImageUrl: values.ogImageUrl ?? null,
    techStack: values.techStack,
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

    const finalOrder = await prepareProjectCreateOrder(parsed.data.order);
    const screenshots = parsed.data.structuredScreenshots ?? [];

    const project = await db.project.create({
      data: {
        ...getProjectData(parsed.data),
        order: finalOrder,
        authorId: session.user.id,
        structuredScreenshots: {
          create: screenshots.map((s, i) => ({
            ...getScreenshotData(s),
            order: s.order ?? i,
          })),
        },
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
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
  try {
    await getActionSession();
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
    const existingProject = await db.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        slug: true,
        order: true,
      },
    });

    if (!existingProject) {
      return actionError("Project not found.");
    }

    const duplicateSlug = await ensureUniqueSlug(parsed.data.slug, projectId);
    if (duplicateSlug) {
      return duplicateSlug;
    }

    await moveProjectOrder(projectId, existingProject.order, parsed.data.order);

    const screenshots = parsed.data.structuredScreenshots ?? [];

    const project = await db.$transaction(async (tx) => {
      // Delete all existing screenshots, then recreate
      await tx.projectScreenshot.deleteMany({
        where: { projectId },
      });

      // Create new screenshots
      if (screenshots.length > 0) {
        await tx.projectScreenshot.createMany({
          data: screenshots.map((s, i) => ({
            ...getScreenshotData(s),
            projectId,
            order: s.order ?? i,
          })),
        });
      }

      // Update the project itself
      return tx.project.update({
        where: { id: projectId },
        data: getProjectData(parsed.data),
        select: {
          id: true,
          slug: true,
          status: true,
        },
      });
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
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { slug: true },
    });

    if (!project) {
      return actionError("Project not found.");
    }

    await db.project.delete({
      where: { id: projectId },
    });

    revalidateProjectPaths(project.slug);

    return actionSuccess(undefined, "Project deleted.");
  } catch (error) {
    console.error("Delete project failed:", error);
    return actionError("Failed to delete project.");
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
    const projects = await db.$transaction(
      parsed.data.map((item) =>
        db.project.update({
          where: { id: item.id },
          data: { order: item.order },
          select: { slug: true },
        }),
      ),
    );

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
