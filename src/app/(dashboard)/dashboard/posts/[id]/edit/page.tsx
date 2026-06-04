import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";
import { PostStatus } from "@/generated/prisma";
import { db } from "@/lib/db";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getPost(id: string) {
  return db.post.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImage: true,
      status: true,
      publishedAt: true,
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
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  await connection();

  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return (
    <PostEditor
      mode="edit"
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        status: post.status === PostStatus.PUBLISHED ? "published" : "draft",
        publishedAt: post.publishedAt?.toISOString() ?? null,
        tags: post.tags.map((tag) => tag.name),
      }}
    />
  );
}
