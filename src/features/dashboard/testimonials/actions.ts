"use server";

import { revalidatePath } from "next/cache";
import {
  type TestimonialActionInput,
  testimonialActionSchema,
  testimonialReorderSchema,
} from "@/features/dashboard/testimonials/validations";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type TestimonialActionData = {
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

function parseTestimonialInput(input: unknown) {
  const parsed = testimonialActionSchema.safeParse(input);

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

function revalidateTestimonialPaths() {
  revalidatePath("/dashboard/testimonials");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

async function getNextTestimonialOrder() {
  const lastItem = await db.testimonial.findFirst({
    orderBy: { order: "desc" },
    select: { order: true },
  });

  return (lastItem?.order ?? -1) + 1;
}

async function prepareTestimonialCreateOrder(order: number) {
  if (order <= 0) {
    return getNextTestimonialOrder();
  }

  await db.testimonial.updateMany({
    where: { order: { gte: order } },
    data: { order: { increment: 1 } },
  });

  return order;
}

async function moveTestimonialOrder(
  testimonialId: string,
  fromOrder: number,
  toOrder: number,
) {
  if (fromOrder === toOrder) {
    return;
  }

  if (toOrder < fromOrder) {
    await db.testimonial.updateMany({
      where: {
        id: { not: testimonialId },
        order: {
          gte: toOrder,
          lt: fromOrder,
        },
      },
      data: { order: { increment: 1 } },
    });
    return;
  }

  await db.testimonial.updateMany({
    where: {
      id: { not: testimonialId },
      order: {
        gt: fromOrder,
        lte: toOrder,
      },
    },
    data: { order: { decrement: 1 } },
  });
}

export async function actionCreateTestimonial(
  input: TestimonialActionInput,
): Promise<ActionResult<TestimonialActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseTestimonialInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

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

    revalidateTestimonialPaths();

    return actionSuccess({ id: testimonial.id }, "Testimonial created.");
  } catch (error) {
    console.error("Create testimonial failed:", error);
    return actionError("Failed to create testimonial.");
  }
}

export async function actionUpdateTestimonial(
  testimonialId: string,
  input: TestimonialActionInput,
): Promise<ActionResult<TestimonialActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parseTestimonialInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  try {
    const existingTestimonial = await db.testimonial.findUnique({
      where: { id: testimonialId },
      select: { id: true, order: true },
    });

    if (!existingTestimonial) {
      return actionError("Testimonial not found.");
    }

    await moveTestimonialOrder(
      testimonialId,
      existingTestimonial.order,
      parsed.data.order,
    );

    const testimonial = await db.testimonial.update({
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

    revalidateTestimonialPaths();

    return actionSuccess({ id: testimonial.id }, "Testimonial updated.");
  } catch (error) {
    console.error("Update testimonial failed:", error);
    return actionError("Failed to update testimonial.");
  }
}

export async function actionDeleteTestimonial(
  testimonialId: string,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const existingTestimonial = await db.testimonial.findUnique({
      where: { id: testimonialId },
      select: { id: true },
    });

    if (!existingTestimonial) {
      return actionError("Testimonial not found.");
    }

    await db.testimonial.delete({
      where: { id: testimonialId },
    });

    revalidateTestimonialPaths();

    return actionSuccess(undefined, "Testimonial deleted.");
  } catch (error) {
    console.error("Delete testimonial failed:", error);
    return actionError("Failed to delete testimonial.");
  }
}

export async function actionReorderTestimonials(
  input: unknown,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = testimonialReorderSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid testimonial order.");
  }

  try {
    await db.$transaction(
      parsed.data.map((item) =>
        db.testimonial.update({
          where: { id: item.id },
          data: { order: item.order },
        }),
      ),
    );

    revalidateTestimonialPaths();

    return actionSuccess(undefined, "Testimonial order updated.");
  } catch (error) {
    console.error("Reorder testimonials failed:", error);
    return actionError("Failed to reorder testimonials.");
  }
}
