"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";

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
      const summary = references
        .map(([label, count]) => `${count} ${label}${count === 1 ? "" : "s"}`)
        .join(", ");

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
