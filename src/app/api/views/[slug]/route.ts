import { NextResponse } from "next/server";
import { PostStatus, ProjectStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type ViewRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

type ContentType = "post" | "project";

function isContentType(value: unknown): value is ContentType {
  return value === "post" || value === "project";
}

export async function POST(request: Request, { params }: ViewRouteContext) {
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
      },
    });

    if (!post) {
      return NextResponse.json({ message: "Post not found" }, { status: 404 });
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

    return NextResponse.json({ views: updatedPost.viewCount });
  }

  const project = await db.project.findFirst({
    where: {
      slug,
      status: ProjectStatus.PUBLISHED,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
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

  return NextResponse.json({ views: updatedProject.viewCount });
}
