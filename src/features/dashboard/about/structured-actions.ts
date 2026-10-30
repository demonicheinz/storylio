"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
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
import {
  education,
  skill,
  skillCategory,
  workExperience,
} from "@/lib/db/schema";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

const tables = { workExperience, education, skillCategory, skill };
type Model = keyof typeof tables;

function revalidateAbout() {
  updateTag(PUBLIC_CACHE_TAGS.about);
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
  const table = tables[model];
  const [item] = await db
    .select({ order: table.order })
    .from(table)
    .where(
      model === "skill" && categoryId !== undefined
        ? eq(skill.categoryId, categoryId)
        : undefined,
    )
    .orderBy(desc(table.order))
    .limit(1);
  return (item?.order ?? -1) + 1;
}

async function reorder(model: Model, input: unknown): Promise<ActionResult> {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = aboutReorderSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid order.");
  try {
    const table = tables[model];
    await db.transaction(async (tx) => {
      for (const { id, order } of parsed.data) {
        const updated = await tx
          .update(table)
          .set({ order, updatedAt: new Date() })
          .where(eq(table.id, id))
          .returning({ id: table.id });
        if (updated.length === 0) throw new Error("Item not found");
      }
    });
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
    const table = tables[model];
    const deleted = await db
      .delete(table)
      .where(eq(table.id, id))
      .returning({ id: table.id });
    if (deleted.length === 0) throw new Error("Item not found");
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
    const [item] = await db
      .insert(workExperience)
      .values({
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
      })
      .returning({ id: workExperience.id });
    if (!item) throw new Error("Item was not created");
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
    const updated = await db
      .update(workExperience)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(workExperience.id, id))
      .returning({ id: workExperience.id });
    if (updated.length === 0) throw new Error("Item not found");
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
    const [item] = await db
      .insert(education)
      .values({
        ...parsed.data,
        degree: parsed.data.degree || null,
        field: parsed.data.field || null,
        location: parsed.data.location || null,
        startYear: parsed.data.startYear || null,
        endYear: parsed.data.endYear || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        order: parsed.data.order || (await nextOrder("education")),
      })
      .returning({ id: education.id });
    if (!item) throw new Error("Item was not created");
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
    const updated = await db
      .update(education)
      .set({
        ...parsed.data,
        degree: parsed.data.degree || null,
        field: parsed.data.field || null,
        location: parsed.data.location || null,
        startYear: parsed.data.startYear || null,
        endYear: parsed.data.endYear || null,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        updatedAt: new Date(),
      })
      .where(eq(education.id, id))
      .returning({ id: education.id });
    if (updated.length === 0) throw new Error("Item not found");
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
    const [item] = await db
      .insert(skillCategory)
      .values({
        ...parsed.data,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        order: parsed.data.order || (await nextOrder("skillCategory")),
      })
      .returning({ id: skillCategory.id });
    if (!item) throw new Error("Item was not created");
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
    const updated = await db
      .update(skillCategory)
      .set({
        ...parsed.data,
        descriptionEn: parsed.data.descriptionEn || null,
        descriptionId: parsed.data.descriptionId || null,
        updatedAt: new Date(),
      })
      .where(eq(skillCategory.id, id))
      .returning({ id: skillCategory.id });
    if (updated.length === 0) throw new Error("Item not found");
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
    const [item] = await db
      .insert(skill)
      .values({
        ...parsed.data,
        level: parsed.data.level || null,
        icon: parsed.data.icon || null,
        order:
          parsed.data.order ||
          (await nextOrder("skill", parsed.data.categoryId)),
      })
      .returning({ id: skill.id });
    if (!item) throw new Error("Item was not created");
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
    await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({ categoryId: skill.categoryId })
        .from(skill)
        .where(eq(skill.id, id));
      if (!existing) throw new Error("Item not found");
      let order = parsed.data.order;
      if (existing.categoryId !== parsed.data.categoryId) {
        const [last] = await tx
          .select({ order: skill.order })
          .from(skill)
          .where(eq(skill.categoryId, parsed.data.categoryId))
          .orderBy(desc(skill.order))
          .limit(1);
        order = (last?.order ?? -1) + 1;
      }
      await tx
        .update(skill)
        .set({
          ...parsed.data,
          order,
          level: parsed.data.level || null,
          icon: parsed.data.icon || null,
          updatedAt: new Date(),
        })
        .where(eq(skill.id, id));
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
export async function actionReorderSkills(input: unknown, categoryId: string) {
  if (!(await authorized())) return actionError("Unauthorized");
  const parsed = aboutReorderSchema.safeParse(input);
  if (
    !parsed.success ||
    typeof categoryId !== "string" ||
    !categoryId.trim() ||
    !parsed.data.length ||
    new Set(parsed.data.map((entry) => entry.id)).size !== parsed.data.length ||
    parsed.data.some((entry, index) => entry.order !== index)
  )
    return actionError("Invalid order.");
  try {
    await db.transaction(async (tx) => {
      const members = await tx
        .select({ id: skill.id })
        .from(skill)
        .where(eq(skill.categoryId, categoryId));
      const ids = new Set(members.map((entry) => entry.id));
      if (
        members.length !== parsed.data.length ||
        parsed.data.some((entry) => !ids.has(entry.id))
      )
        throw new Error("Category membership changed");
      for (const entry of parsed.data) {
        const changed = await tx
          .update(skill)
          .set({ order: entry.order, updatedAt: new Date() })
          .where(and(eq(skill.id, entry.id), eq(skill.categoryId, categoryId)))
          .returning({ id: skill.id });
        if (!changed.length) throw new Error("Category membership changed");
      }
    });
    revalidateAbout();
    return actionSuccess(undefined, "Order updated.");
  } catch (error) {
    console.error("Reorder skills failed:", error);
    return actionError("The skill list changed. Refresh and try again.");
  }
}
