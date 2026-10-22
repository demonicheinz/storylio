"use server";

import { eq, inArray, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { containsPattern } from "@/lib/db/query-utils";
import {
  galleryItem,
  homeSection,
  media as mediaTable,
  post,
  project,
  projectScreenshot,
  testimonial,
  user,
} from "@/lib/db/schema";

export type MediaUsageItem = {
  id: string;
  filename: string;
  references: Array<{ label: string; count: number }>;
};

export type MediaUsagePreview = {
  canDelete: MediaUsageItem[];
  blocked: MediaUsageItem[];
};

async function getMediaReferences(url: string) {
  const [
    profiles,
    postCovers,
    postContent,
    projectCovers,
    projectThumbnails,
    projectOgImages,
    projectContent,
    projectScreenshots,
    galleryItems,
    testimonials,
    homeSections,
  ] = await Promise.all([
    db.$count(user, eq(user.image, url)),
    db.$count(post, eq(post.coverImage, url)),
    db.$count(post, like(post.content, containsPattern(url))),
    db.$count(project, eq(project.coverImage, url)),
    db.$count(project, eq(project.thumbnailImageUrl, url)),
    db.$count(project, eq(project.ogImageUrl, url)),
    db.$count(project, like(project.content, containsPattern(url))),
    db.$count(projectScreenshot, eq(projectScreenshot.imageUrl, url)),
    db.$count(galleryItem, eq(galleryItem.imageUrl, url)),
    db.$count(testimonial, eq(testimonial.avatar, url)),
    db.$count(homeSection, eq(homeSection.imageUrl, url)),
  ]);

  const references: [string, number][] = [
    ["profile", profiles],
    ["post cover", postCovers],
    ["post content", postContent],
    ["project cover", projectCovers],
    ["project thumbnail", projectThumbnails],
    ["project OG image", projectOgImages],
    ["project content", projectContent],
    ["project screenshot", projectScreenshots],
    ["gallery item", galleryItems],
    ["testimonial avatar", testimonials],
    ["home section", homeSections],
  ];

  return references.filter(([, count]) => count > 0);
}

function serializeReferences(references: [string, number][]) {
  return references.map(([label, count]) => ({ label, count }));
}

function summarizeReferences(
  references: Array<{ label: string; count: number }>,
) {
  return references
    .map(({ label, count }) => `${count} ${label}${count === 1 ? "" : "s"}`)
    .join(", ");
}

function normalizeMediaFilename(filename: string) {
  return filename.trim().replace(/\s+/g, " ");
}

function validateMediaFilename(filename: string): string | null {
  if (!filename) {
    return "File name is required";
  }

  if (filename.length > 160) {
    return "File name must be 160 characters or less";
  }

  if (/[\\/:*?"<>|\r\n]/.test(filename)) {
    return 'File name cannot contain \\ / : * ? " < > | or line breaks';
  }

  return null;
}

async function getUsagePreview(mediaIds: string[]): Promise<MediaUsagePreview> {
  const uniqueIds = Array.from(new Set(mediaIds)).filter(Boolean);

  if (uniqueIds.length === 0) {
    return { canDelete: [], blocked: [] };
  }

  const mediaItems = await db.query.media.findMany({
    where: inArray(mediaTable.id, uniqueIds),
    columns: {
      id: true,
      filename: true,
      url: true,
    },
  });

  const usageItems = await Promise.all(
    mediaItems.map(async (media) => {
      const references = serializeReferences(
        await getMediaReferences(media.url),
      );

      return {
        id: media.id,
        filename: media.filename,
        references,
      };
    }),
  );

  return {
    canDelete: usageItems.filter((item) => item.references.length === 0),
    blocked: usageItems.filter((item) => item.references.length > 0),
  };
}

export async function actionRenameMedia(
  mediaId: string,
  filename: string,
): Promise<ActionResult<{ id: string; filename: string }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const normalizedFilename = normalizeMediaFilename(filename);
  const validationError = validateMediaFilename(normalizedFilename);

  if (validationError) {
    return actionError(validationError);
  }

  try {
    const existing = await db.query.media.findFirst({
      where: eq(mediaTable.id, mediaId),
      columns: { id: true },
    });

    if (!existing) {
      return actionError("Media not found");
    }

    const [media] = await db
      .update(mediaTable)
      .set({ filename: normalizedFilename })
      .where(eq(mediaTable.id, mediaId))
      .returning({ id: mediaTable.id, filename: mediaTable.filename });
    if (!media) throw new Error("Media not found");

    revalidatePath("/dashboard/media");
    return actionSuccess(media);
  } catch (error) {
    console.error("Rename media failed:", error);
    return actionError("Failed to rename media");
  }
}

export async function actionCheckMediaUsage(
  mediaIds: string[],
): Promise<ActionResult<MediaUsagePreview>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const preview = await getUsagePreview(mediaIds);
    return actionSuccess(preview);
  } catch (error) {
    console.error("Check media usage failed:", error);
    return actionError("Failed to check media usage");
  }
}

export async function actionDeleteMedia(
  mediaId: string,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const media = await db.query.media.findFirst({
      where: eq(mediaTable.id, mediaId),
    });

    if (!media) {
      return actionError("Media not found");
    }

    const references = await getMediaReferences(media.url);
    if (references.length > 0) {
      const summary = summarizeReferences(serializeReferences(references));

      return actionError(
        `Media is still in use by ${summary}. Remove those references before deleting it.`,
      );
    }

    await deleteFromCloudinary(media.publicId);
    const deleted = await db
      .delete(mediaTable)
      .where(eq(mediaTable.id, mediaId))
      .returning({ id: mediaTable.id });
    if (deleted.length === 0) throw new Error("Media not found");

    revalidatePath("/dashboard/media");
    return actionSuccess(undefined);
  } catch (error) {
    console.error("Delete media failed:", error);
    return actionError("Failed to delete media");
  }
}

export async function actionDeleteMediaBatch(
  mediaIds: string[],
): Promise<ActionResult<{ deletedIds: string[] }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const preview = await getUsagePreview(mediaIds);

    if (preview.blocked.length > 0) {
      const blockedSummary = preview.blocked
        .map(
          (item) =>
            `${item.filename} (${summarizeReferences(item.references)})`,
        )
        .join("; ");

      return actionError(
        `Some media is still in use: ${blockedSummary}. Remove those references before deleting it.`,
      );
    }

    const deleteIds = preview.canDelete.map((item) => item.id);
    if (deleteIds.length === 0) {
      return actionError("No media selected for deletion");
    }

    const mediaItems = await db.query.media.findMany({
      where: inArray(mediaTable.id, deleteIds),
      columns: {
        id: true,
        publicId: true,
      },
    });

    await Promise.all(
      mediaItems.map((media) => deleteFromCloudinary(media.publicId)),
    );

    await db.delete(mediaTable).where(inArray(mediaTable.id, deleteIds));

    revalidatePath("/dashboard/media");
    return actionSuccess({ deletedIds: deleteIds });
  } catch (error) {
    console.error("Delete media batch failed:", error);
    return actionError("Failed to delete selected media");
  }
}
