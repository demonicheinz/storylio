"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";

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
    db.user.count({ where: { image: url } }),
    db.post.count({ where: { coverImage: url } }),
    db.post.count({ where: { content: { contains: url } } }),
    db.project.count({ where: { coverImage: url } }),
    db.project.count({ where: { thumbnailImageUrl: url } }),
    db.project.count({ where: { ogImageUrl: url } }),
    db.project.count({ where: { content: { contains: url } } }),
    db.projectScreenshot.count({ where: { imageUrl: url } }),
    db.galleryItem.count({ where: { imageUrl: url } }),
    db.testimonial.count({ where: { avatar: url } }),
    db.homeSection.count({ where: { imageUrl: url } }),
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

async function getUsagePreview(mediaIds: string[]): Promise<MediaUsagePreview> {
  const uniqueIds = Array.from(new Set(mediaIds)).filter(Boolean);

  if (uniqueIds.length === 0) {
    return { canDelete: [], blocked: [] };
  }

  const mediaItems = await db.media.findMany({
    where: { id: { in: uniqueIds } },
    select: {
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
    const media = await db.media.findUnique({
      where: { id: mediaId },
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
    await db.media.delete({
      where: { id: mediaId },
    });

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

    const mediaItems = await db.media.findMany({
      where: { id: { in: deleteIds } },
      select: {
        id: true,
        publicId: true,
      },
    });

    await Promise.all(
      mediaItems.map((media) => deleteFromCloudinary(media.publicId)),
    );

    await db.media.deleteMany({
      where: { id: { in: deleteIds } },
    });

    revalidatePath("/dashboard/media");
    return actionSuccess({ deletedIds: deleteIds });
  } catch (error) {
    console.error("Delete media batch failed:", error);
    return actionError("Failed to delete selected media");
  }
}
