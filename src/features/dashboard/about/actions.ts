"use server";

import { revalidatePath } from "next/cache";
import {
  ABOUT_CONTENT_SINGLETON_ID,
  aboutContentOrderBy,
} from "@/features/about/data";
import {
  type AboutContentActionInput,
  aboutContentActionSchema,
} from "@/features/dashboard/about/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { getMdxSafetyError } from "@/lib/mdx-safety";

export async function actionUpdateAboutContent(
  input: AboutContentActionInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = aboutContentActionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Please fix the highlighted fields.",
      flattenFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  const mdxFields = [
    "howIWorkEn",
    "howIWorkId",
    "whatIValueEn",
    "whatIValueId",
  ] as const;
  const mdxFieldErrors: Record<string, string[]> = {};
  await Promise.all(
    mdxFields.map(async (field) => {
      const error = await getMdxSafetyError(parsed.data[field]);
      if (error) mdxFieldErrors[field] = [error];
    }),
  );
  if (Object.keys(mdxFieldErrors).length > 0) {
    return actionError("Please fix the highlighted fields.", mdxFieldErrors);
  }

  try {
    const data = {
      introEn: parsed.data.introEn || null,
      introId: parsed.data.introId || null,
      howIWorkEn: parsed.data.howIWorkEn || null,
      howIWorkId: parsed.data.howIWorkId || null,
      whatIValueEn: parsed.data.whatIValueEn || null,
      whatIValueId: parsed.data.whatIValueId || null,
      defaultLanguage: parsed.data.defaultLanguage,
    };
    const aboutContent = await db.$transaction(async (tx) => {
      const existing = await tx.aboutContent.findMany({
        orderBy: aboutContentOrderBy,
        select: { id: true },
      });
      const primary = existing[0];
      const saved = primary
        ? await tx.aboutContent.update({
            where: { id: primary.id },
            data,
            select: { id: true },
          })
        : await tx.aboutContent.create({
            data: { id: ABOUT_CONTENT_SINGLETON_ID, ...data },
            select: { id: true },
          });

      if (existing.length > 1) {
        await tx.aboutContent.deleteMany({
          where: { id: { in: existing.slice(1).map(({ id }) => id) } },
        });
      }
      return saved;
    });

    revalidatePath("/dashboard/about");
    revalidatePath("/about");
    return actionSuccess({ id: aboutContent.id }, "About content updated.");
  } catch (error) {
    console.error("Update About content failed:", error);
    return actionError("Failed to update About content.");
  }
}
