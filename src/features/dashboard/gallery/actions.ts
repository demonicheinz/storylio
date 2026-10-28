"use server";

import { and, desc, eq, gt, gte, inArray, lt, lte, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import {
  type GalleryItemActionInput,
  galleryItemActionSchema,
  galleryReorderSchema,
} from "@/features/dashboard/gallery/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { galleryItem as galleryItemTable } from "@/lib/db/schema";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type GalleryActionData = {
  id: string;
};

const galleryItemIdsSchema = z.array(z.string().min(1)).min(1).max(100);

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
  updateTag(PUBLIC_CACHE_TAGS.gallery);
  revalidatePath("/dashboard/gallery");
  revalidatePath("/dashboard");
  revalidatePath("/gallery");
}

async function getNextGalleryOrder(tx: Transaction) {
  const lastItem = await tx.query.galleryItem.findFirst({
    orderBy: desc(galleryItemTable.order),
    columns: { order: true },
  });
  return (lastItem?.order ?? -1) + 1;
}

async function prepareGalleryCreateOrder(tx: Transaction, order: number) {
  if (order <= 0) return getNextGalleryOrder(tx);
  await tx
    .update(galleryItemTable)
    .set({ order: sql`${galleryItemTable.order} + 1` })
    .where(gte(galleryItemTable.order, order));
  return order;
}

async function moveGalleryOrder(
  tx: Transaction,
  itemId: string,
  fromOrder: number,
  toOrder: number,
) {
  if (fromOrder === toOrder) return;
  if (toOrder < fromOrder) {
    await tx
      .update(galleryItemTable)
      .set({ order: sql`${galleryItemTable.order} + 1` })
      .where(
        and(
          ne(galleryItemTable.id, itemId),
          gte(galleryItemTable.order, toOrder),
          lt(galleryItemTable.order, fromOrder),
        ),
      );
    return;
  }
  await tx
    .update(galleryItemTable)
    .set({ order: sql`${galleryItemTable.order} - 1` })
    .where(
      and(
        ne(galleryItemTable.id, itemId),
        gt(galleryItemTable.order, fromOrder),
        lte(galleryItemTable.order, toOrder),
      ),
    );
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
    const item = await db.transaction(async (tx) => {
      const [savedItem] = await tx
        .insert(galleryItemTable)
        .values({
          imageUrl: parsed.data.imageUrl,
          caption: parsed.data.caption || null,
          description: parsed.data.description || null,
          altText: parsed.data.altText || null,
          category: parsed.data.category,
          width: parsed.data.width ?? null,
          height: parsed.data.height ?? null,
          size: parsed.data.size ?? null,
          aspectRatio:
            parsed.data.aspectRatio ??
            (parsed.data.width && parsed.data.height
              ? parsed.data.width / parsed.data.height
              : null),
          blurDataUrl: parsed.data.blurDataUrl ?? null,
          isVisible: parsed.data.isVisible,
          order: await prepareGalleryCreateOrder(tx, parsed.data.order),
        })
        .returning({ id: galleryItemTable.id });
      if (!savedItem) throw new Error("Gallery item not found.");
      return savedItem;
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
    const existingItem = await db.query.galleryItem.findFirst({
      where: eq(galleryItemTable.id, itemId),
      columns: { id: true, order: true },
    });

    if (!existingItem) {
      return actionError("Gallery item not found.");
    }

    const item = await db.transaction(async (tx) => {
      await moveGalleryOrder(tx, itemId, existingItem.order, parsed.data.order);
      const [savedItem] = await tx
        .update(galleryItemTable)
        .set({
          imageUrl: parsed.data.imageUrl,
          caption: parsed.data.caption || null,
          description: parsed.data.description || null,
          altText: parsed.data.altText || null,
          category: parsed.data.category,
          width: parsed.data.width ?? null,
          height: parsed.data.height ?? null,
          size: parsed.data.size ?? null,
          aspectRatio:
            parsed.data.aspectRatio ??
            (parsed.data.width && parsed.data.height
              ? parsed.data.width / parsed.data.height
              : null),
          blurDataUrl: parsed.data.blurDataUrl ?? null,
          isVisible: parsed.data.isVisible,
          order: parsed.data.order,
        })
        .where(eq(galleryItemTable.id, itemId))
        .returning({ id: galleryItemTable.id });
      if (!savedItem) throw new Error("Gallery item not found.");
      return savedItem;
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
    const existingItem = await db.query.galleryItem.findFirst({
      where: eq(galleryItemTable.id, itemId),
      columns: { id: true },
    });

    if (!existingItem) {
      return actionError("Gallery item not found.");
    }

    await db.delete(galleryItemTable).where(eq(galleryItemTable.id, itemId));

    revalidateGalleryPaths();

    return actionSuccess(undefined, "Gallery item deleted.");
  } catch (error) {
    console.error("Delete gallery item failed:", error);
    return actionError("Failed to delete gallery item.");
  }
}

function parseGalleryItemIds(itemIds: string[]) {
  const parsed = galleryItemIdsSchema.safeParse(itemIds);

  if (!parsed.success) {
    return actionError("Select at least one gallery item.");
  }

  return parsed.data;
}

export async function actionShowGalleryItems(
  itemIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseGalleryItemIds(itemIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    const result = await db
      .update(galleryItemTable)
      .set({
        isVisible: true,
      })
      .where(
        and(
          inArray(galleryItemTable.id, parsedIds),
          eq(galleryItemTable.isVisible, false),
        ),
      )
      .returning({ id: galleryItemTable.id });

    revalidateGalleryPaths();

    return actionSuccess(
      { count: result.length },
      result.length === 1
        ? "Gallery item shown."
        : `${result.length} gallery items shown.`,
    );
  } catch (error) {
    console.error("Show gallery items failed:", error);
    return actionError("Failed to show gallery items.");
  }
}

export async function actionHideGalleryItems(
  itemIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseGalleryItemIds(itemIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    const result = await db
      .update(galleryItemTable)
      .set({
        isVisible: false,
      })
      .where(
        and(
          inArray(galleryItemTable.id, parsedIds),
          eq(galleryItemTable.isVisible, true),
        ),
      )
      .returning({ id: galleryItemTable.id });

    revalidateGalleryPaths();

    return actionSuccess(
      { count: result.length },
      result.length === 1
        ? "Gallery item hidden."
        : `${result.length} gallery items hidden.`,
    );
  } catch (error) {
    console.error("Hide gallery items failed:", error);
    return actionError("Failed to hide gallery items.");
  }
}

export async function actionDeleteGalleryItems(
  itemIds: string[],
): Promise<ActionResult<{ count: number }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsedIds = parseGalleryItemIds(itemIds);
  if (!Array.isArray(parsedIds)) {
    return parsedIds;
  }

  try {
    const result = await db
      .delete(galleryItemTable)
      .where(inArray(galleryItemTable.id, parsedIds))
      .returning({ id: galleryItemTable.id });

    revalidateGalleryPaths();

    return actionSuccess(
      { count: result.length },
      result.length === 1
        ? "Gallery item deleted."
        : `${result.length} gallery items deleted.`,
    );
  } catch (error) {
    console.error("Delete gallery items failed:", error);
    return actionError("Failed to delete gallery items.");
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
    await db.transaction(async (tx) => {
      for (const item of parsed.data) {
        const [updatedItem] = await tx
          .update(galleryItemTable)
          .set({ order: item.order })
          .where(eq(galleryItemTable.id, item.id))
          .returning({ id: galleryItemTable.id });
        if (!updatedItem) throw new Error("Gallery item not found.");
      }
    });

    revalidateGalleryPaths();

    return actionSuccess(undefined, "Gallery order updated.");
  } catch (error) {
    console.error("Reorder gallery items failed:", error);
    return actionError("Failed to reorder gallery items.");
  }
}
