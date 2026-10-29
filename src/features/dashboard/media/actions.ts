"use server";

import { eq, inArray, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { containsPattern } from "@/lib/db/query-utils";
import {
  aboutContent,
  galleryItem,
  homeSection,
  media as mediaTable,
  post,
  project,
  projectScreenshot,
  user,
} from "@/lib/db/schema";
import { MEDIA_BATCH_LIMIT } from "./constants";

const MEDIA_CONCURRENCY = 3;

export type MediaUsageItem = {
  id: string;
  filename: string;
  references: Array<{ label: string; count: number }>;
};

export type MediaUsagePreview = {
  canDelete: MediaUsageItem[];
  blocked: MediaUsageItem[];
};

export type MediaBatchDeleteResult = {
  deletedIds: string[];
  failedItems?: Array<{ id: string; filename: string; error: string }>;
  blocked?: MediaUsageItem[];
};

async function mapMediaConcurrent<T, R>(
  items: T[],
  processItem: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(MEDIA_CONCURRENCY, items.length) },
      async () => {
        while (next < items.length) {
          const index = next++;
          results[index] = await processItem(items[index]);
        }
      },
    ),
  );
  return results;
}

async function getMediaReferences(url: string) {
  const pattern = containsPattern(url);
  const checks: Array<[string, () => PromiseLike<number>]> = [
    ["profile", () => db.$count(user, eq(user.image, url))],
    ["post cover", () => db.$count(post, eq(post.coverImage, url))],
    ["post content", () => db.$count(post, like(post.content, pattern))],
    ["project cover", () => db.$count(project, eq(project.coverImage, url))],
    [
      "project thumbnail",
      () => db.$count(project, eq(project.thumbnailImageUrl, url)),
    ],
    ["project OG image", () => db.$count(project, eq(project.ogImageUrl, url))],
    [
      "project content",
      () => db.$count(project, like(project.content, pattern)),
    ],
    [
      "project screenshot",
      () => db.$count(projectScreenshot, eq(projectScreenshot.imageUrl, url)),
    ],
    [
      "gallery item",
      () => db.$count(galleryItem, eq(galleryItem.imageUrl, url)),
    ],
    [
      "home section",
      () => db.$count(homeSection, eq(homeSection.imageUrl, url)),
    ],
    [
      "about content",
      () =>
        db.$count(
          aboutContent,
          or(
            like(aboutContent.howIWorkEn, pattern),
            like(aboutContent.howIWorkId, pattern),
            like(aboutContent.whatIValueEn, pattern),
            like(aboutContent.whatIValueId, pattern),
          ),
        ),
    ],
  ];

  // One query per active image keeps the shared reference check limit at three.
  const references: [string, number][] = [];
  for (const [label, check] of checks) {
    const count = await check();
    if (count > 0) references.push([label, count]);
  }
  return references;
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

function validateMediaBatch(mediaIds: string[]): string | null {
  if (!Array.isArray(mediaIds)) {
    return "Select valid media IDs";
  }
  if (mediaIds.length > MEDIA_BATCH_LIMIT) {
    return `Select at most ${MEDIA_BATCH_LIMIT} media items at a time`;
  }
  if (mediaIds.some((id) => typeof id !== "string" || !id.trim())) {
    return "Select valid media IDs";
  }
  return null;
}

function revalidateMedia() {
  try {
    revalidatePath("/dashboard/media");
  } catch {
    console.error("Media changes saved, but media page revalidation failed");
  }
}

async function deleteMediaRecord(media: {
  id: string;
  publicId: string;
}): Promise<string | null> {
  try {
    if ((await deleteFromCloudinary(media.publicId)) !== true) {
      return "Remote deletion was not confirmed. The media record was kept; retry deletion.";
    }
  } catch {
    return "Could not confirm remote deletion. The media record was kept; retry deletion.";
  }

  try {
    // This is reconciliation across two systems, not an atomic transaction.
    const deleted = await db
      .delete(mediaTable)
      .where(eq(mediaTable.id, media.id))
      .returning({ id: mediaTable.id });
    if (deleted.length === 0) {
      const remaining = await db.query.media.findFirst({
        where: eq(mediaTable.id, media.id),
        columns: { id: true },
      });
      if (remaining) throw new Error("Media record was not deleted");
    }
    return null;
  } catch {
    return "The remote image was removed, but its media record could not be deleted. Retry deletion to remove the record.";
  }
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

  const usageItems = await mapMediaConcurrent(mediaItems, async (media) => {
    const references = serializeReferences(await getMediaReferences(media.url));

    return {
      id: media.id,
      filename: media.filename,
      references,
    };
  });

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

    revalidateMedia();
    return actionSuccess(media);
  } catch {
    console.error("Rename media failed");
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

  const validationError = validateMediaBatch(mediaIds);
  if (validationError) return actionError(validationError);

  try {
    const preview = await getUsagePreview(mediaIds);
    return actionSuccess(preview);
  } catch {
    console.error("Check media usage failed");
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

    const error = await deleteMediaRecord(media);
    if (error) return actionError(error);

    revalidateMedia();
    return actionSuccess(undefined);
  } catch {
    console.error("Delete media failed");
    return actionError("Failed to delete media");
  }
}

export async function actionDeleteMediaBatch(
  mediaIds: string[],
): Promise<ActionResult<MediaBatchDeleteResult>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const validationError = validateMediaBatch(mediaIds);
  if (validationError) return actionError(validationError);

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
        filename: true,
      },
    });

    const outcomes = await mapMediaConcurrent(mediaItems, async (media) => ({
      id: media.id,
      filename: media.filename,
      error: await deleteMediaRecord(media),
    }));
    const deletedIds: string[] = [];
    const failedItems: NonNullable<MediaBatchDeleteResult["failedItems"]> = [];
    for (const item of outcomes) {
      if (item.error) failedItems.push({ ...item, error: item.error });
      else deletedIds.push(item.id);
    }

    if (deletedIds.length > 0) revalidateMedia();
    return actionSuccess({
      deletedIds,
      ...(failedItems.length > 0 ? { failedItems } : {}),
    });
  } catch {
    console.error("Delete media batch failed");
    return actionError("Failed to delete selected media");
  }
}
