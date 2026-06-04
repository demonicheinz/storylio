"use server";

import { revalidatePath } from "next/cache";
import {
  type GalleryItemActionInput,
  galleryItemActionSchema,
  galleryReorderSchema,
} from "@/features/dashboard/gallery/validations";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type GalleryActionData = {
  id: string;
};

function flattenFieldErrors(
  fieldErrors: Record<string, string[] | undefined>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(fieldErrors).filter((entry): entry is [string, string[]] =>
      Array.isArray(entry[1]),
    ),
  );
}

function parseGalleryInput(input: unknown) {
  const parsed = galleryItemActionSchema.safeParse(input);

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

function revalidateGalleryPaths() {
  revalidatePath("/dashboard/gallery");
  revalidatePath("/dashboard");
  revalidatePath("/gallery");
}

async function getNextGalleryOrder() {
  const lastItem = await db.galleryItem.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastItem?.order ?? -1) + 1;
}

export async function actionCreateGalleryItem(
  input: GalleryItemActionInput,
): Promise<ActionResult<GalleryActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseGalleryInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const item = await db.galleryItem.create({
      data: {
        imageUrl: parsed.data.imageUrl,
        caption: parsed.data.caption || null,
        category: parsed.data.category,
        order: parsed.data.order || (await getNextGalleryOrder()),
      },
      select: { id: true },
    });

    revalidateGalleryPaths();

    return actionSuccess({ id: item.id }, "Gallery item created.");
  } catch (error) {
    console.error("Create gallery item failed:", error);
    return actionError("Failed to create gallery item.");
  }
}

export async function actionUpdateGalleryItem(
  itemId: string,
  input: GalleryItemActionInput,
): Promise<ActionResult<GalleryActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseGalleryInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const existingItem = await db.galleryItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!existingItem) {
      return actionError("Gallery item not found.");
    }

    const item = await db.galleryItem.update({
      where: { id: itemId },
      data: {
        imageUrl: parsed.data.imageUrl,
        caption: parsed.data.caption || null,
        category: parsed.data.category,
        order: parsed.data.order,
      },
      select: { id: true },
    });

    revalidateGalleryPaths();

    return actionSuccess({ id: item.id }, "Gallery item updated.");
  } catch (error) {
    console.error("Update gallery item failed:", error);
    return actionError("Failed to update gallery item.");
  }
}

export async function actionDeleteGalleryItem(
  itemId: string,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const existingItem = await db.galleryItem.findUnique({
      where: { id: itemId },
      select: { id: true },
    });

    if (!existingItem) {
      return actionError("Gallery item not found.");
    }

    await db.galleryItem.delete({
      where: { id: itemId },
    });

    revalidateGalleryPaths();

    return actionSuccess(undefined, "Gallery item deleted.");
  } catch (error) {
    console.error("Delete gallery item failed:", error);
    return actionError("Failed to delete gallery item.");
  }
}

export async function actionReorderGalleryItems(
  input: unknown,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = galleryReorderSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid gallery order.");
  }

  try {
    await db.$transaction(
      parsed.data.map((item) =>
        db.galleryItem.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    revalidateGalleryPaths();

    return actionSuccess(undefined, "Gallery order updated.");
  } catch (error) {
    console.error("Reorder gallery items failed:", error);
    return actionError("Failed to reorder gallery items.");
  }
}
