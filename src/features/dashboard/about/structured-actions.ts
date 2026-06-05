"use server";

import { revalidatePath } from "next/cache";
import {
  aboutReorderSchema,
  type EducationInput,
  educationSchema,
  type SkillCategoryInput,
  type SkillInput,
  skillCategorySchema,
  skillSchema,
  type WorkExperienceInput,
  workExperienceSchema,
} from "@/features/dashboard/about/validations";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";

type Model = "workExperience" | "education" | "skillCategory" | "skill";

function revalidateAbout() {
  revalidatePath("/dashboard/about");
  revalidatePath("/about");
}

async function authorized() {
  try {
    await getActionSession();
    return true;
  } catch {
    return false;
  }
}

function lines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function nextOrder(model: Model, categoryId?: string) {
  const where = model === "skill" ? { categoryId } : undefined;
  const item = await (db[model] as typeof db.skill).findFirst({
    where,
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return (item?.order ?? -1) + 1;
}

async function reorder(model: Model, input: unknown): Promise<ActionResult> {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = aboutReorderSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid order.");
  try {
    await db.$transaction(
      parsed.data.map(({ id, order }) =>
        (db[model] as typeof db.skill).update({
          where: { id },
          data: { order },
        }),
      ),
    );
    revalidateAbout();
    return actionSuccess(undefined, "Order updated.");
  } catch (error) {
    console.error(`Reorder ${model} failed:`, error);
    return actionError("Failed to update order.");
  }
}

async function remove(model: Model, id: string): Promise<ActionResult> {
  if (!(await authorized())) return actionError("Unauthorized");
  try {
    await (db[model] as typeof db.skill).delete({ where: { id } });
    revalidateAbout();
    return actionSuccess(undefined, "Item deleted.");
  } catch (error) {
    console.error(`Delete ${model} failed:`, error);
    return actionError("Failed to delete item.");
  }
}

export async function actionCreateWorkExperience(input: WorkExperienceInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = workExperienceSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    const item = await db.workExperience.create({
      data: {
        ...parsed.data,
        company: parsed.data.company || null,
        location: parsed.data.location || null,
        type: parsed.data.type || null,
        startDate: parsed.data.startDate || null,
        endDate: parsed.data.endDate || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        highlightsEn: lines(parsed.data.highlightsEn),
        highlightsId: lines(parsed.data.highlightsId),
        order: parsed.data.order || (await nextOrder("workExperience")),
      },
      select: { id: true },
    });
    revalidateAbout();
    return actionSuccess(item, "Work experience created.");
  } catch (error) {
    console.error("Create work experience failed:", error);
    return actionError("Failed to create work experience.");
  }
}

export async function actionUpdateWorkExperience(
  id: string,
  input: WorkExperienceInput,
) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = workExperienceSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    await db.workExperience.update({
      where: { id },
      data: {
        ...parsed.data,
        company: parsed.data.company || null,
        location: parsed.data.location || null,
        type: parsed.data.type || null,
        startDate: parsed.data.startDate || null,
        endDate: parsed.data.endDate || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        highlightsEn: lines(parsed.data.highlightsEn),
        highlightsId: lines(parsed.data.highlightsId),
      },
    });
    revalidateAbout();
    return actionSuccess({ id }, "Work experience updated.");
  } catch (error) {
    console.error("Update work experience failed:", error);
    return actionError("Failed to update work experience.");
  }
}

export async function actionDeleteWorkExperience(id: string) {
  return remove("workExperience", id);
}
export async function actionReorderWorkExperiences(input: unknown) {
  return reorder("workExperience", input);
}

export async function actionCreateEducation(input: EducationInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    const item = await db.education.create({
      data: {
        ...parsed.data,
        degree: parsed.data.degree || null,
        field: parsed.data.field || null,
        location: parsed.data.location || null,
        startYear: parsed.data.startYear || null,
        endYear: parsed.data.endYear || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        order: parsed.data.order || (await nextOrder("education")),
      },
      select: { id: true },
    });
    revalidateAbout();
    return actionSuccess(item, "Education item created.");
  } catch (error) {
    console.error("Create education failed:", error);
    return actionError("Failed to create education.");
  }
}

export async function actionUpdateEducation(id: string, input: EducationInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = educationSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    await db.education.update({
      where: { id },
      data: {
        ...parsed.data,
        degree: parsed.data.degree || null,
        field: parsed.data.field || null,
        location: parsed.data.location || null,
        startYear: parsed.data.startYear || null,
        endYear: parsed.data.endYear || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
      },
    });
    revalidateAbout();
    return actionSuccess({ id }, "Education item updated.");
  } catch (error) {
    console.error("Update education failed:", error);
    return actionError("Failed to update education.");
  }
}

export async function actionDeleteEducation(id: string) {
  return remove("education", id);
}
export async function actionReorderEducationItems(input: unknown) {
  return reorder("education", input);
}

export async function actionCreateSkillCategory(input: SkillCategoryInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = skillCategorySchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    const item = await db.skillCategory.create({
      data: {
        ...parsed.data,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        order: parsed.data.order || (await nextOrder("skillCategory")),
      },
      select: { id: true },
    });
    revalidateAbout();
    return actionSuccess(item, "Skill category created.");
  } catch (error) {
    console.error("Create skill category failed:", error);
    return actionError("Failed to create skill category.");
  }
}

export async function actionUpdateSkillCategory(
  id: string,
  input: SkillCategoryInput,
) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = skillCategorySchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    await db.skillCategory.update({
      where: { id },
      data: {
        ...parsed.data,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
      },
    });
    revalidateAbout();
    return actionSuccess({ id }, "Skill category updated.");
  } catch (error) {
    console.error("Update skill category failed:", error);
    return actionError("Failed to update skill category.");
  }
}

export async function actionDeleteSkillCategory(id: string) {
  return remove("skillCategory", id);
}
export async function actionReorderSkillCategories(input: unknown) {
  return reorder("skillCategory", input);
}

export async function actionCreateSkill(input: SkillInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    const item = await db.skill.create({
      data: {
        ...parsed.data,
        level: parsed.data.level || null,
        icon: parsed.data.icon || null,
        order:
          parsed.data.order ||
          (await nextOrder("skill", parsed.data.categoryId)),
      },
      select: { id: true },
    });
    revalidateAbout();
    return actionSuccess(item, "Skill created.");
  } catch (error) {
    console.error("Create skill failed:", error);
    return actionError("Failed to create skill.");
  }
}

export async function actionUpdateSkill(id: string, input: SkillInput) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = skillSchema.safeParse(input);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");
  try {
    await db.skill.update({
      where: { id },
      data: {
        ...parsed.data,
        level: parsed.data.level || null,
        icon: parsed.data.icon || null,
      },
    });
    revalidateAbout();
    return actionSuccess({ id }, "Skill updated.");
  } catch (error) {
    console.error("Update skill failed:", error);
    return actionError("Failed to update skill.");
  }
}

export async function actionDeleteSkill(id: string) {
  return remove("skill", id);
}
export async function actionReorderSkills(input: unknown) {
  return reorder("skill", input);
}
