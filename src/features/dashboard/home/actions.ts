"use server";

import { revalidatePath } from "next/cache";
import {
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  homeSectionActionSchema,
  homeSectionReorderSchema,
} from "@/features/dashboard/home/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import { HomeSectionType } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type HomeSectionActionData = {
  id: string;
};

function parseHomeSectionInput(input: unknown) {
  const parsed = homeSectionActionSchema.safeParse(input);

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

function toHomeSectionType(type: HomeSectionActionValues["type"]) {
  return type === "LOGO" ? HomeSectionType.LOGO : HomeSectionType.PHASE;
}

function revalidateHomePaths() {
  revalidatePath("/dashboard/home");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

async function getNextHomeSectionOrder(type: HomeSectionActionValues["type"]) {
  const lastSection = await db.homeSection.findFirst({
    where: { type: toHomeSectionType(type) },
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastSection?.order ?? -1) + 1;
}

async function prepareHomeSectionCreateOrder(
  type: HomeSectionActionValues["type"],
  order: number,
) {
  if (order <= 0) {
    return getNextHomeSectionOrder(type);
  }

  await db.homeSection.updateMany({
    where: {
      type: toHomeSectionType(type),
      order: { gte: order },
    },
    data: { order: { increment: 1 } },
  });

  return order;
}

async function moveHomeSectionOrder({
  fromOrder,
  fromType,
  sectionId,
  toOrder,
  toType,
}: {
  sectionId: string;
  fromType: HomeSectionType;
  toType: HomeSectionType;
  fromOrder: number;
  toOrder: number;
}) {
  if (fromType !== toType) {
    await db.homeSection.updateMany({
      where: {
        type: fromType,
        id: { not: sectionId },
        order: { gt: fromOrder },
      },
      data: { order: { decrement: 1 } },
    });
    await db.homeSection.updateMany({
      where: {
        type: toType,
        id: { not: sectionId },
        order: { gte: toOrder },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  if (fromOrder === toOrder) {
    return;
  }

  if (toOrder < fromOrder) {
    await db.homeSection.updateMany({
      where: {
        type: toType,
        id: { not: sectionId },
        order: {
          gte: toOrder,
          lt: fromOrder,
        },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await db.homeSection.updateMany({
    where: {
      type: toType,
      id: { not: sectionId },
      order: {
        gt: fromOrder,
        lte: toOrder,
      },
    },
    data: { order: { decrement: 1 } },
  });
}

function getHomeSectionData(values: HomeSectionActionValues) {
  return {
    type: toHomeSectionType(values.type),
    label: values.label,
    content: values.content || null,
    imageUrl: values.type === "LOGO" ? (values.imageUrl ?? null) : null,
    order: values.order,
  };
}

export async function actionCreateHomeSection(
  input: HomeSectionActionInput,
): Promise<ActionResult<HomeSectionActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseHomeSectionInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const section = await db.homeSection.create({
      data: {
        ...getHomeSectionData(parsed.data),
        order: await prepareHomeSectionCreateOrder(
          parsed.data.type,
          parsed.data.order,
        ),
      },
      select: { id: true },
    });

    revalidateHomePaths();

    return actionSuccess({ id: section.id }, "Home section created.");
  } catch (error) {
    console.error("Create home section failed:", error);
    return actionError("Failed to create home section.");
  }
}

export async function actionUpdateHomeSection(
  sectionId: string,
  input: HomeSectionActionInput,
): Promise<ActionResult<HomeSectionActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseHomeSectionInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const existingSection = await db.homeSection.findUnique({
      where: { id: sectionId },
      select: { id: true, order: true, type: true },
    });

    if (!existingSection) {
      return actionError("Home section not found.");
    }

    await moveHomeSectionOrder({
      sectionId,
      fromType: existingSection.type,
      toType: toHomeSectionType(parsed.data.type),
      fromOrder: existingSection.order,
      toOrder: parsed.data.order,
    });

    const section = await db.homeSection.update({
      where: { id: sectionId },
      data: getHomeSectionData(parsed.data),
      select: { id: true },
    });

    revalidateHomePaths();

    return actionSuccess({ id: section.id }, "Home section updated.");
  } catch (error) {
    console.error("Update home section failed:", error);
    return actionError("Failed to update home section.");
  }
}

export async function actionDeleteHomeSection(
  sectionId: string,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const existingSection = await db.homeSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!existingSection) {
      return actionError("Home section not found.");
    }

    await db.homeSection.delete({
      where: { id: sectionId },
    });

    revalidateHomePaths();

    return actionSuccess(undefined, "Home section deleted.");
  } catch (error) {
    console.error("Delete home section failed:", error);
    return actionError("Failed to delete home section.");
  }
}

export async function actionReorderHomeSections(
  input: unknown,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = homeSectionReorderSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid home section order.");
  }

  try {
    await db.$transaction(
      parsed.data.map((item) =>
        db.homeSection.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    revalidateHomePaths();

    return actionSuccess(undefined, "Home content order updated.");
  } catch (error) {
    console.error("Reorder home sections failed:", error);
    return actionError("Failed to reorder home content.");
  }
}
