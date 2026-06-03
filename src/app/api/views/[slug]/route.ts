import { NextResponse } from "next/server";
import { PostStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type ViewRouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function POST(_request: Request, { params }: ViewRouteContext) {
  const { slug } = await params;

  const post = await db.post.findFirst({
    where: {
      slug,
      status: PostStatus.PUBLISHED,
    },
    select: {
      id: true,
    },
  });

  if (!post) {
    return NextResponse.json({ message: "Post not found" }, { status: 404 });
  }

  const updatedPost = await db.post.update({
    where: {
      id: post.id,
    },
    data: {
      viewCount: {
        increment: 1,
      },
    },
    select: {
      viewCount: true,
    },
  });

  return NextResponse.json({
    views: updatedPost.viewCount,
  });
}
