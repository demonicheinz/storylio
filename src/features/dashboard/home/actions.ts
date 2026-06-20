"use server";

import { revalidatePath } from "next/cache";
import {
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  homeSectionActionSchema,
  reorderSchema,
  type TestimonialActionInput,
  testimonialActionSchema,
} from "@/features/dashboard/home/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import { HomeSectionType } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type EntityActionData = { id: string };
type TestimonialOrderClient = {
  testimonial: Pick<typeof db.testimonial, "updateMany">;
};

async function requireSession(): Promise<ActionResult | null> {
  try {
    await getActionSession();
    return null;
  } catch {
    return actionError("Unauthorized");
  }
}

function revalidateHomePaths() {
  revalidatePath("/dashboard/home");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

function parseInput<T>(
  schema: {
    safeParse: (v: unknown) =>
      | { success: true; data: T }
      | {
          success: false;
          error: { flatten: () => { fieldErrors: Record<string, string[]> } };
        };
  },
  input: unknown,
): { success: true; data: T } | { success: false; result: ActionResult } {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      result: actionError(
        "Please fix the highlighted fields.",
        flattenFieldErrors(parsed.error.flatten().fieldErrors),
      ),
    };
  }

  return { success: true, data: parsed.data };
}

async function getNextTestimonialOrder() {
  const last = await db.testimonial.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

async function prepareTestimonialCreateOrder(order: number) {
  if (order <= 0) return getNextTestimonialOrder();

  await db.testimonial.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });

  return order;
}

async function moveTestimonialOrder(
  client: TestimonialOrderClient,
  testimonialId: string,
  fromOrder: number,
  toOrder: number,
) {
  if (fromOrder === toOrder) return;

  if (toOrder < fromOrder) {
    await client.testimonial.updateMany({
      where: {
        id: { not: testimonialId },
        order: { gte: toOrder, lt: fromOrder },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await client.testimonial.updateMany({
    where: {
      id: { not: testimonialId },
      order: { gt: fromOrder, lte: toOrder },
    },
    data: { order: { decrement: 1 } },
  });
}

function toHomeSectionType(type: HomeSectionActionValues["type"]) {
  return type === "LOGO" ? HomeSectionType.LOGO : HomeSectionType.PHASE;
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

async function getNextHomeSectionOrder(type: HomeSectionActionValues["type"]) {
  const last = await db.homeSection.findFirst({
    where: { type: toHomeSectionType(type) },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (last?.order ?? -1) + 1;
}

async function prepareHomeSectionCreateOrder(
  type: HomeSectionActionValues["type"],
  order: number,
) {
  if (order <= 0) return getNextHomeSectionOrder(type);

  await db.homeSection.updateMany({
    where: { type: toHomeSectionType(type), order: { gte: order } },
    data: { order: { increment: 1 } },
  });

  return order;
}

async function moveHomeSectionOrder({
  sectionId,
  fromType,
  toType,
  fromOrder,
  toOrder,
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
      where: { type: toType, id: { not: sectionId }, order: { gte: toOrder } },
      data: { order: { increment: 1 } },
    });
    return;
  }

  if (fromOrder === toOrder) return;

  if (toOrder < fromOrder) {
    await db.homeSection.updateMany({
      where: {
        type: toType,
        id: { not: sectionId },
        order: { gte: toOrder, lt: fromOrder },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await db.homeSection.updateMany({
    where: {
      type: toType,
      id: { not: sectionId },
      order: { gt: fromOrder, lte: toOrder },
    },
    data: { order: { decrement: 1 } },
  });
}

export async function actionCreateTestimonial(
  input: TestimonialActionInput,
): Promise<ActionResult<EntityActionData>> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = parseInput(testimonialActionSchema, input);
  if (!parsed.success) return parsed.result;

  try {
    const testimonial = await db.testimonial.create({
      data: {
        name: parsed.data.name,
        role: parsed.data.role || null,
        company: parsed.data.company || null,
        avatar: parsed.data.avatar ?? null,
        content: parsed.data.content,
        isVisible: parsed.data.isVisible,
        order: await prepareTestimonialCreateOrder(parsed.data.order),
      },
      select: { id: true },
    });

    revalidateHomePaths();
    return actionSuccess({ id: testimonial.id }, "Testimonial created.");
  } catch (error) {
    console.error("Create testimonial failed:", error);
    return actionError("Failed to create testimonial.");
  }
}

export async function actionUpdateTestimonial(
  testimonialId: string,
  input: TestimonialActionInput,
): Promise<ActionResult<EntityActionData>> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = parseInput(testimonialActionSchema, input);
  if (!parsed.success) return parsed.result;

  try {
    const existing = await db.testimonial.findUnique({
      where: { id: testimonialId },
      select: { id: true, order: true },
    });

    if (!existing) return actionError("Testimonial not found.");

    const testimonial = await db.$transaction(async (tx) => {
      await moveTestimonialOrder(
        tx,
        testimonialId,
        existing.order,
        parsed.data.order,
      );

      return tx.testimonial.update({
        where: { id: testimonialId },
        data: {
          name: parsed.data.name,
          role: parsed.data.role || null,
          company: parsed.data.company || null,
          avatar: parsed.data.avatar ?? null,
          content: parsed.data.content,
          isVisible: parsed.data.isVisible,
          order: parsed.data.order,
        },
        select: { id: true },
      });
    });

    revalidateHomePaths();
    return actionSuccess({ id: testimonial.id }, "Testimonial updated.");
  } catch (error) {
    console.error("Update testimonial failed:", error);
    return actionError("Failed to update testimonial.");
  }
}

export async function actionDeleteTestimonial(
  testimonialId: string,
): Promise<ActionResult> {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const existing = await db.testimonial.findUnique({
      where: { id: testimonialId },
      select: { id: true },
    });

    if (!existing) return actionError("Testimonial not found.");

    await db.testimonial.delete({ where: { id: testimonialId } });

    revalidateHomePaths();
    return actionSuccess(undefined, "Testimonial deleted.");
  } catch (error) {
    console.error("Delete testimonial failed:", error);
    return actionError("Failed to delete testimonial.");
  }
}

export async function actionReorderTestimonials(
  input: unknown,
): Promise<ActionResult> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid testimonial order.");

  try {
    await db.$transaction(
      parsed.data.map((item) =>
        db.testimonial.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    revalidateHomePaths();
    return actionSuccess(undefined, "Testimonial order updated.");
  } catch (error) {
    console.error("Reorder testimonials failed:", error);
    return actionError("Failed to reorder testimonials.");
  }
}

export async function actionCreateHomeSection(
  input: HomeSectionActionInput,
): Promise<ActionResult<EntityActionData>> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = parseInput(homeSectionActionSchema, input);
  if (!parsed.success) return parsed.result;

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
): Promise<ActionResult<EntityActionData>> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = parseInput(homeSectionActionSchema, input);
  if (!parsed.success) return parsed.result;

  try {
    const existing = await db.homeSection.findUnique({
      where: { id: sectionId },
      select: { id: true, order: true, type: true },
    });

    if (!existing) return actionError("Home section not found.");

    await moveHomeSectionOrder({
      sectionId,
      fromType: existing.type,
      toType: toHomeSectionType(parsed.data.type),
      fromOrder: existing.order,
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
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const existing = await db.homeSection.findUnique({
      where: { id: sectionId },
      select: { id: true },
    });

    if (!existing) return actionError("Home section not found.");

    await db.homeSection.delete({ where: { id: sectionId } });

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
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid home section order.");

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
