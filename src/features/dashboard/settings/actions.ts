"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  type AccountPasswordActionInput,
  accountPasswordActionSchema,
  type ChangeEmailActionInput,
  changeEmailActionSchema,
  type ProfileSettingsActionInput,
  profileSettingsActionSchema,
} from "@/features/dashboard/settings/validations";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { auth } from "@/lib/auth";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { isOwnerEmail } from "@/lib/owner-guard";

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
        websiteUrl: parsed.data.websiteUrl ?? null,
        publicEmail: parsed.data.publicEmail ?? null,
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

export async function actionChangeEmail(
  input: ChangeEmailActionInput,
): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = changeEmailActionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(
      "Please fix the highlighted fields.",
      flattenFieldErrors(parsed.error.flatten().fieldErrors),
    );
  }

  if (!isOwnerEmail(parsed.data.newEmail)) {
    return actionError(
      "Add the new email to OWNER_EMAIL before starting the email change.",
      {
        newEmail: ["This email is not included in OWNER_EMAIL."],
      },
    );
  }

  try {
    await auth.api.changeEmail({
      body: {
        newEmail: parsed.data.newEmail,
        callbackURL: "/dashboard/settings",
      },
      headers: await headers(),
    });

    revalidateSettingsPaths();

    return actionSuccess(
      undefined,
      "A confirmation email has been sent to your new email address. Click the link to confirm the change.",
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to change email.";
    console.error("Change email failed:", message);

    // Provide user-friendly messages for common errors
    if (message.includes("same")) {
      return actionError("The new email is the same as your current email.");
    }

    return actionError("Failed to change email. Please try again.");
  }
}
