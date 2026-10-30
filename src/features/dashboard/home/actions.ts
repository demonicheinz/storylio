"use server";

import { and, desc, eq, gt, gte, lt, lte, ne, sql } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import {
  type HomeHeroActionInput,
  type HomeSectionActionInput,
  type HomeSectionActionValues,
  homeHeroActionSchema,
  homeSectionActionSchema,
  reorderSchema,
} from "@/features/dashboard/home/validations";
import { flattenFieldErrors } from "@/features/dashboard/shared/utils/flatten-field-errors";
import { saveHomeHeadline } from "@/features/home/hero-content";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { HomeSectionType } from "@/lib/db/enums";
import {
  homeSection as homeSectionTable,
  user as userTable,
} from "@/lib/db/schema";
import {
  getHomeLogoSettings,
  serializeHomeLogoSettings,
} from "@/lib/home-technologies";
import { PUBLIC_CACHE_TAGS } from "@/lib/public-cache-tags";

type EntityActionData = { id: string };
type OrderTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Save only the headline; the profile bio is owned by Settings. */
export async function actionSetHeroHeadline(
  input: Pick<HomeHeroActionInput, "headline">,
): Promise<ActionResult> {
  const authResult = await requireSession();
  if (authResult) return authResult;
  const parsed = parseInput(
    homeHeroActionSchema.pick({ headline: true }),
    input,
  );
  if (!parsed.success) return parsed.result;
  try {
    await saveHomeHeadline(db, parsed.data.headline);
    revalidateHomePaths();
    return actionSuccess(undefined, "Headline saved.");
  } catch {
    return actionError("Could not save the headline. Try again.");
  }
}

export async function actionUpdateHomeHero(
  input: HomeHeroActionInput,
): Promise<ActionResult> {
  let session: Awaited<ReturnType<typeof getActionSession>>;
  try {
    session = await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }
  const parsed = parseInput(homeHeroActionSchema, input);
  if (!parsed.success) return parsed.result;
  try {
    await db.transaction(async (tx) => {
      const rows = await tx
        .update(userTable)
        .set({ bio: parsed.data.subheadline || null })
        .where(eq(userTable.id, session.user.id))
        .returning({ id: userTable.id });
      if (rows.length === 0) throw new Error("Profile not found");
      await saveHomeHeadline(tx, parsed.data.headline);
    });
    updateTag(PUBLIC_CACHE_TAGS.profile);
    revalidateHomePaths();
    revalidatePath("/dashboard/settings");
    revalidatePath("/about");
    return actionSuccess(undefined, "Home hero updated.");
  } catch {
    return actionError(
      "Could not save the hero. Ensure database migrations are up to date.",
    );
  }
}

async function requireSession(): Promise<ActionResult | null> {
  try {
    await getActionSession();
    return null;
  } catch {
    return actionError("Unauthorized");
  }
}

function revalidateHomePaths() {
  updateTag(PUBLIC_CACHE_TAGS.home);
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

function toHomeSectionType(type: HomeSectionActionValues["type"]) {
  return type === "LOGO" ? HomeSectionType.LOGO : HomeSectionType.PHASE;
}

function getHomeSectionData(values: HomeSectionActionValues) {
  const settings = getHomeLogoSettings(values);
  const content =
    values.type === "LOGO" &&
    (values.category !== undefined || values.showOnHome !== undefined)
      ? serializeHomeLogoSettings({
          category: values.category ?? settings.category,
          showOnHome: values.showOnHome ?? settings.showOnHome,
          description: settings.description,
        })
      : values.content || null;
  return {
    type: toHomeSectionType(values.type),
    label: values.label,
    content,
    imageUrl: values.type === "LOGO" ? (values.imageUrl ?? null) : null,
    order: values.order,
  };
}

async function prepareHomeSectionCreateOrder(
  tx: OrderTransaction,
  type: HomeSectionActionValues["type"],
  order: number,
) {
  if (order <= 0) {
    const last = await tx.query.homeSection.findFirst({
      where: eq(homeSectionTable.type, toHomeSectionType(type)),
      orderBy: desc(homeSectionTable.order),
      columns: { order: true },
    });
    return (last?.order ?? -1) + 1;
  }

  await tx
    .update(homeSectionTable)
    .set({ order: sql`${homeSectionTable.order} + 1` })
    .where(
      and(
        eq(homeSectionTable.type, toHomeSectionType(type)),
        gte(homeSectionTable.order, order),
      ),
    );
  return order;
}

async function moveHomeSectionOrder(
  tx: OrderTransaction,
  {
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
  },
) {
  if (fromType !== toType) {
    await tx
      .update(homeSectionTable)
      .set({ order: sql`${homeSectionTable.order} - 1` })
      .where(
        and(
          eq(homeSectionTable.type, fromType),
          ne(homeSectionTable.id, sectionId),
          gt(homeSectionTable.order, fromOrder),
        ),
      );
    await tx
      .update(homeSectionTable)
      .set({ order: sql`${homeSectionTable.order} + 1` })
      .where(
        and(
          eq(homeSectionTable.type, toType),
          ne(homeSectionTable.id, sectionId),
          gte(homeSectionTable.order, toOrder),
        ),
      );
    return;
  }

  if (fromOrder === toOrder) return;
  const movingEarlier = toOrder < fromOrder;
  await tx
    .update(homeSectionTable)
    .set({
      order: movingEarlier
        ? sql`${homeSectionTable.order} + 1`
        : sql`${homeSectionTable.order} - 1`,
    })
    .where(
      and(
        eq(homeSectionTable.type, toType),
        ne(homeSectionTable.id, sectionId),
        movingEarlier
          ? and(
              gte(homeSectionTable.order, toOrder),
              lt(homeSectionTable.order, fromOrder),
            )
          : and(
              gt(homeSectionTable.order, fromOrder),
              lte(homeSectionTable.order, toOrder),
            ),
      ),
    );
}

export async function actionCreateHomeSection(
  input: HomeSectionActionInput,
): Promise<ActionResult<EntityActionData>> {
  const authError = await requireSession();
  if (authError) return authError;

  const parsed = parseInput(homeSectionActionSchema, input);
  if (!parsed.success) return parsed.result;

  try {
    const section = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(homeSectionTable)
        .values({
          ...getHomeSectionData(parsed.data),
          order: await prepareHomeSectionCreateOrder(
            tx,
            parsed.data.type,
            parsed.data.order,
          ),
        })
        .returning({ id: homeSectionTable.id });
      if (!created) throw new Error("Item was not created");
      return created;
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
    const existing = await db.query.homeSection.findFirst({
      where: eq(homeSectionTable.id, sectionId),
      columns: { id: true, order: true, type: true },
    });

    if (!existing) return actionError("Home section not found.");

    const section = await db.transaction(async (tx) => {
      await moveHomeSectionOrder(tx, {
        sectionId,
        fromType: existing.type,
        toType: toHomeSectionType(parsed.data.type),
        fromOrder: existing.order,
        toOrder: parsed.data.order,
      });
      const [updated] = await tx
        .update(homeSectionTable)
        .set(getHomeSectionData(parsed.data))
        .where(eq(homeSectionTable.id, sectionId))
        .returning({ id: homeSectionTable.id });
      if (!updated) throw new Error("Home section not found");
      return updated;
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
    const existing = await db.query.homeSection.findFirst({
      where: eq(homeSectionTable.id, sectionId),
      columns: { id: true },
    });

    if (!existing) return actionError("Home section not found.");

    const deleted = await db
      .delete(homeSectionTable)
      .where(eq(homeSectionTable.id, sectionId))
      .returning({ id: homeSectionTable.id });
    if (deleted.length === 0) throw new Error("Item not found");

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
    await db.transaction(async (tx) => {
      const items = [...parsed.data].sort((a, b) => a.order - b.order);
      if (
        items.length === 0 ||
        new Set(items.map(({ id }) => id)).size !== items.length ||
        new Set(items.map(({ order }) => order)).size !== items.length
      )
        throw new Error("Invalid order");

      // Lock the collection before checking completeness and writing positions.
      const sections = await tx
        .select({ id: homeSectionTable.id, type: homeSectionTable.type })
        .from(homeSectionTable)
        .where(ne(homeSectionTable.type, HomeSectionType.HERO))
        .for("update");
      const type = sections.find(({ id }) => id === items[0].id)?.type;
      if (type !== HomeSectionType.PHASE && type !== HomeSectionType.LOGO)
        throw new Error("Invalid section type");
      const groupIds = new Set(
        sections.filter((section) => section.type === type).map(({ id }) => id),
      );
      if (
        groupIds.size !== items.length ||
        items.some(({ id }) => !groupIds.has(id))
      )
        throw new Error("Submit the complete section group");

      for (const [order, item] of items.entries()) {
        const updated = await tx
          .update(homeSectionTable)
          .set({ order })
          .where(
            and(
              eq(homeSectionTable.id, item.id),
              eq(homeSectionTable.type, type),
            ),
          )
          .returning({ id: homeSectionTable.id });
        if (updated.length !== 1) throw new Error("Item not found");
      }
    });

    revalidateHomePaths();
    return actionSuccess(undefined, "Home content order updated.");
  } catch (error) {
    console.error("Reorder home sections failed:", error);
    return actionError("Failed to reorder home content.");
  }
}
