import { connection } from "next/server";
import {
  type DashboardPost,
  PostsManager,
} from "@/features/dashboard/posts/components/posts-manager";
import { db } from "@/lib/db";

async function getPosts(): Promise<DashboardPost[]> {
  const posts = await db.post.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      coverImage: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      viewCount: true,
      tags: {
        select: {
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  return posts.map((post) => ({
    ...post,
    status: post.status,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() ?? null,
  }));
}

export default async function PostsPage() {
  await connection();

  const posts = await getPosts();

  return <PostsManager posts={posts} />;
}
