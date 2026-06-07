import { createHash } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { PostStatus, ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

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
    const post = await db.post.findFirst({
      where: {
        slug,
        status: PostStatus.PUBLISHED,
        OR: [{ publishedAt: null }, { publishedAt: { lte: new Date() } }],
      },
      select: {
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

    const [updatedPost] = await db.$transaction([
      db.post.update({
        where: { id: post.id },
        data: { viewCount: { increment: 1 } },
        select: { viewCount: true },
      }),
      db.viewEvent.create({
        data: { type, slug },
      }),
    ]);

    return viewResponse(request, cookieName, updatedPost.viewCount, false);
  }

  const project = await db.project.findFirst({
    where: {
      slug,
      status: ProjectStatus.PUBLISHED,
    },
    select: {
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

  const [updatedProject] = await db.$transaction([
    db.project.update({
      where: { id: project.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    }),
    db.viewEvent.create({
      data: { type, slug },
    }),
  ]);

  return viewResponse(request, cookieName, updatedProject.viewCount, false);
}
