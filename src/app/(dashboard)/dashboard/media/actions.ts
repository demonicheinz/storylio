"use server";

import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { db } from "@/lib/db";

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

    // Delete from Cloudinary
    await deleteFromCloudinary(media.publicId);

    // Delete from DB
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
