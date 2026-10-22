import { desc } from "drizzle-orm";
import { connection } from "next/server";
import {
  type DashboardPost,
  PostsManager,
} from "@/features/dashboard/posts/components/posts-manager";
import { db } from "@/lib/db";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";

async function getPosts(): Promise<DashboardPost[]> {
  const posts = await db.query.post
    .findMany({
      orderBy: (table) => [desc(table.createdAt)],
      columns: {
        id: true,
        title: true,
        slug: true,
        status: true,
        coverImage: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        viewCount: true,
      },
      with: {
        tags: {
          columns: {},
          with: {
            tag: {
              columns: {
                name: true,
              },
            },
          },
          orderBy: orderPostTagsByName,
        },
      },
    })
    .then((rows) => rows.map((row) => flattenPostTags(row)));

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
