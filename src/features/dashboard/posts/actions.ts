"use server";

import { revalidatePath } from "next/cache";
import {
  type PostActionInput,
  type PostActionValues,
  postActionSchema,
} from "@/features/dashboard/posts/validations";
import { PostStatus } from "@/generated/prisma";
import type { ActionResult } from "@/lib/action-result";
import { actionError, actionSuccess } from "@/lib/action-result";
import { getActionSession } from "@/lib/auth-session";
import { db } from "@/lib/db";
import { getMdxSafetyError } from "@/lib/mdx-safety";

type PostActionData = {
  id: string;
  slug: string;
  status: "draft" | "published";
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

function parsePostInput(input: unknown) {
  const parsed = postActionSchema.safeParse(input);

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

function toPostStatus(status: PostActionValues["status"]) {
  return status === "published" ? PostStatus.PUBLISHED : PostStatus.DRAFT;
}

function parseScheduledPublishDate(value?: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toPublishedAt(values: PostActionValues, current?: Date | null) {
  if (values.status !== "published") {
    return null;
  }

  const scheduledPublishDate = parseScheduledPublishDate(
    values.scheduledPublishDate,
  );

  if (scheduledPublishDate) {
    return scheduledPublishDate;
  }

  return current ?? new Date();
}

function revalidatePostPaths(slug: string, oldSlug?: string) {
  revalidatePath("/dashboard/posts");
  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/");
  revalidatePath(`/blog/${slug}`);

  if (oldSlug && oldSlug !== slug) {
    revalidatePath(`/blog/${oldSlug}`);
  }
}

async function ensureUniqueSlug(slug: string, postId?: string) {
  const existingPost = await db.post.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingPost && existingPost.id !== postId) {
    return actionError("Slug is already used.", {
      slug: ["This slug is already used by another post."],
    });
  }

  return undefined;
}

function tagsToConnectOrCreate(tags: string[]) {
  return tags.map((name) => ({
    where: { name },
    create: { name },
  }));
}

export async function actionCreatePost(
  input: PostActionInput,
): Promise<ActionResult<PostActionData>> {
  let session: Awaited<ReturnType<typeof getActionSession>>;

  try {
    session = await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parsePostInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  const mdxError = await getMdxSafetyError(parsed.data.content);
  if (mdxError) {
    return actionError("Please fix the highlighted fields.", {
      content: [mdxError],
    });
  }

  try {
    const duplicateSlug = await ensureUniqueSlug(parsed.data.slug);
    if (duplicateSlug) {
      return duplicateSlug;
    }

    const post = await db.post.create({
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        coverImage: parsed.data.coverImage ?? null,
        status: toPostStatus(parsed.data.status),
        publishedAt: toPublishedAt(parsed.data),
        authorId: session.user.id,
        tags: {
          connectOrCreate: tagsToConnectOrCreate(parsed.data.tags),
        },
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    revalidatePostPaths(post.slug);

    return actionSuccess(
      {
        id: post.id,
        slug: post.slug,
        status: post.status === PostStatus.PUBLISHED ? "published" : "draft",
      },
      post.status === PostStatus.PUBLISHED ? "Post published." : "Draft saved.",
    );
  } catch (error) {
    console.error("Create post failed:", error);
    return actionError("Failed to create post.");
  }
}

export async function actionUpdatePost(
  postId: string,
  input: PostActionInput,
): Promise<ActionResult<PostActionData>> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  const parsed = parsePostInput(input);
  if (!parsed.success) {
    return parsed.result;
  }

  const mdxError = await getMdxSafetyError(parsed.data.content);
  if (mdxError) {
    return actionError("Please fix the highlighted fields.", {
      content: [mdxError],
    });
  }

  try {
    const existingPost = await db.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        slug: true,
        publishedAt: true,
      },
    });

    if (!existingPost) {
      return actionError("Post not found.");
    }

    const duplicateSlug = await ensureUniqueSlug(parsed.data.slug, postId);
    if (duplicateSlug) {
      return duplicateSlug;
    }

    const post = await db.post.update({
      where: { id: postId },
      data: {
        title: parsed.data.title,
        slug: parsed.data.slug,
        excerpt: parsed.data.excerpt || null,
        content: parsed.data.content,
        coverImage: parsed.data.coverImage ?? null,
        status: toPostStatus(parsed.data.status),
        publishedAt: toPublishedAt(parsed.data, existingPost.publishedAt),
        tags: {
          set: [],
          connectOrCreate: tagsToConnectOrCreate(parsed.data.tags),
        },
      },
      select: {
        id: true,
        slug: true,
        status: true,
      },
    });

    revalidatePostPaths(post.slug, existingPost.slug);

    return actionSuccess(
      {
        id: post.id,
        slug: post.slug,
        status: post.status === PostStatus.PUBLISHED ? "published" : "draft",
      },
      post.status === PostStatus.PUBLISHED ? "Post published." : "Draft saved.",
    );
  } catch (error) {
    console.error("Update post failed:", error);
    return actionError("Failed to update post.");
  }
}

export async function actionDeletePost(postId: string): Promise<ActionResult> {
  try {
    await getActionSession();
  } catch {
    return actionError("Unauthorized");
  }

  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      select: { slug: true },
    });

    if (!post) {
      return actionError("Post not found.");
    }

    await db.post.delete({
      where: { id: postId },
    });

    revalidatePostPaths(post.slug);

    return actionSuccess(undefined, "Post deleted.");
  } catch (error) {
    console.error("Delete post failed:", error);
    return actionError("Failed to delete post.");
  }
}

export async function actionPublishPost(
  input: PostActionInput,
  postId?: string,
): Promise<ActionResult<PostActionData>> {
  const values = {
    ...input,
    status: "published",
  } satisfies PostActionInput;

  if (postId) {
    return actionUpdatePost(postId, values);
  }

  return actionCreatePost(values);
}

export async function actionSavePostDraft(
  input: PostActionInput,
  postId?: string,
): Promise<ActionResult<PostActionData>> {
  const values = {
    ...input,
    status: "draft",
  } satisfies PostActionInput;

  if (postId) {
    return actionUpdatePost(postId, values);
  }

  return actionCreatePost(values);
}
