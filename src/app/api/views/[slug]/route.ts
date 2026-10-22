import { createHash } from "node:crypto";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { PostStatus, ProjectStatus } from "@/lib/db/enums";
import {
  post as postTable,
  project as projectTable,
  viewEvent,
} from "@/lib/db/schema";

type ViewRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type ContentType = "post" | "project";
const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24;

function isContentType(value: unknown): value is ContentType {
  return value === "post" || value === "project";
}

function getViewCookieName(type: ContentType, slug: string) {
  const key = createHash("sha256").update(`${type}:${slug}`).digest("hex");
  return `storylio_view_${key.slice(0, 24)}`;
}

function viewResponse(
  request: NextRequest,
  cookieName: string,
  views: number,
  deduplicated: boolean,
) {
  const response = NextResponse.json({ views, deduplicated });

  if (!deduplicated) {
    response.cookies.set(cookieName, "1", {
      httpOnly: true,
      maxAge: VIEW_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    });
  }

  return response;
}

export async function POST(request: NextRequest, { params }: ViewRouteContext) {
  const { slug } = await params;
  const body: unknown = await request.json().catch(() => null);
  const type =
    body && typeof body === "object" && "type" in body ? body.type : null;

  if (!isContentType(type) || !slug.trim()) {
    return NextResponse.json(
      { message: "A valid content type and slug are required" },
      { status: 400 },
    );
  }

  if (type === "post") {
    const post = await db.query.post.findFirst({
      where: and(
        eq(postTable.slug, slug),
        eq(postTable.status, PostStatus.PUBLISHED),
        or(
          isNull(postTable.publishedAt),
          lte(postTable.publishedAt, new Date()),
        ),
      ),
      columns: {
        id: true,
        viewCount: true,
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
    }

    const cookieName = getViewCookieName(type, slug);
    if (request.cookies.has(cookieName)) {
      return viewResponse(request, cookieName, post.viewCount, true);
    }

    const updatedPost = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(postTable)
        .set({ viewCount: sql`${postTable.viewCount} + 1` })
        .where(eq(postTable.id, post.id))
        .returning({ viewCount: postTable.viewCount });
      if (!updated) throw new Error("Post not found");
      await tx.insert(viewEvent).values({ type, slug });
      return updated;
    });

    return viewResponse(request, cookieName, updatedPost.viewCount, false);
  }

  const project = await db.query.project.findFirst({
    where: and(
      eq(projectTable.slug, slug),
      eq(projectTable.status, ProjectStatus.PUBLISHED),
    ),
    columns: {
      id: true,
      viewCount: true,
    },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  }

  const cookieName = getViewCookieName(type, slug);
  if (request.cookies.has(cookieName)) {
    return viewResponse(request, cookieName, project.viewCount, true);
  }

  const updatedProject = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(projectTable)
      .set({ viewCount: sql`${projectTable.viewCount} + 1` })
      .where(eq(projectTable.id, project.id))
      .returning({ viewCount: projectTable.viewCount });
    if (!updated) throw new Error("Project not found");
    await tx.insert(viewEvent).values({ type, slug });
    return updated;
  });

  return viewResponse(request, cookieName, updatedProject.viewCount, false);
}
