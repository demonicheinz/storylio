"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  ABOUT_CONTENT_SINGLETON_ID,
  aboutContentOrderBy,
} from "@/features/about/data";
import {
  type AboutContentActionInput,
  type AccountPasswordActionInput,
  aboutContentActionSchema,
  accountPasswordActionSchema,
  type ProfileSettingsActionInput,
  profileSettingsActionSchema,
} from "@/features/dashboard/settings/validations";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type ProfileSettingsActionData = {
  id: string;
  name: string;
  email: string;
  image: string | null;
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

function revalidateSettingsPaths() {
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath("/about");
}

export async function actionUpdateProfileSettings(
  input: ProfileSettingsActionInput,
): Promise<ActionResult<ProfileSettingsActionData>> {
  let session: Awaited<ReturnType<typeof getActionSession>>;

  try {
    session = await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = profileSettingsActionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Please fix the highlighted fields.",
      flattenFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  try {
    const user = await db.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        image: parsed.data.image ?? null,
        tagline: parsed.data.tagline || null,
        bio: parsed.data.bio || null,
        github: parsed.data.github ?? null,
        instagram: parsed.data.instagram ?? null,
        twitter: parsed.data.twitter ?? null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    revalidateSettingsPaths();

    return actionSuccess(
      {
        id: user.id,
        name: user.name ?? "User",
        email: user.email,
        image: user.image,
      },
      "Profile settings updated.",
    );
  } catch (error) {
    console.error("Update profile settings failed:", error);
    return actionError("Failed to update profile settings.");
  }
}

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
            data: {
              id: ABOUT_CONTENT_SINGLETON_ID,
              ...data,
            },
            select: { id: true },
          });

      if (existing.length > 1) {
        await tx.aboutContent.deleteMany({
          where: { id: { in: existing.slice(1).map(({ id }) => id) } },
        });
      }

      return saved;
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/about");

    return actionSuccess({ id: aboutContent.id }, "About content updated.");
  } catch (error) {
    console.error("Update About content failed:", error);
    return actionError("Failed to update About content.");
  }
}

export async function actionChangePassword(
  input: AccountPasswordActionInput,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = accountPasswordActionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Please fix the highlighted fields.",
      flattenFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return actionSuccess(undefined, "Password changed.");
  } catch (error) {
    console.error("Change password failed:", error);
    return actionError(
      "Failed to change password. Check the current password.",
    );
  }
}
