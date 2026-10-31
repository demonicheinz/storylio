"use server";

import { asc, desc, eq, inArray } from "drizzle-orm";
import { ABOUT_CONTENT_SINGLETON_ID } from "@/features/about/data";
import {
  type AboutContentActionInput,
  aboutContentActionSchema,
} from "@/features/dashboard/about/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { aboutContent as aboutContentTable } from "@/lib/db/schema";
import { getMdxSafetyError } from "@/lib/mdx-safety";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";
import { revalidatePath, updateTag } from "@/lib/revalidation";

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
    const aboutContent = await db.transaction(async (tx) => {
      const existing = await tx.query.aboutContent.findMany({
        orderBy: [desc(aboutContentTable.updatedAt), asc(aboutContentTable.id)],
        columns: { id: true },
      });
      const primary = existing[0];
      const [saved] = primary
        ? await tx
            .update(aboutContentTable)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(aboutContentTable.id, primary.id))
            .returning({ id: aboutContentTable.id })
        : await tx
            .insert(aboutContentTable)
            .values({ id: ABOUT_CONTENT_SINGLETON_ID, ...data })
            .returning({ id: aboutContentTable.id });
      if (!saved) throw new Error("About content not found");

      if (existing.length > 1) {
        await tx.delete(aboutContentTable).where(
          inArray(
            aboutContentTable.id,
            existing.slice(1).map(({ id }) => id),
          ),
        );
      }
      return saved;
    });

    updateTag(PUBLIC_CACHE_TAGS.about);
    revalidatePath("/dashboard/about");
    revalidatePath("/about");
    return actionSuccess({ id: aboutContent.id }, "About content updated.");
  } catch (error) {
    console.error("Update About content failed:", error);
    return actionError("Failed to update About content.");
  }
}
