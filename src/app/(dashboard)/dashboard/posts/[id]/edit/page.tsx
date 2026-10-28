import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PostEditor } from "@/features/dashboard/posts/components/post-editor";
import { DashboardRouteBoundary } from "@/features/dashboard/shared/components/route-boundary";
import { db } from "@/lib/db";
import { PostStatus } from "@/lib/db/enums";
import { flattenPostTags, orderPostTagsByName } from "@/lib/db/query-utils";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getPost(id: string) {
  return db.query.post
    .findFirst({
      where: (table) => eq(table.id, id),
      columns: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImage: true,
        status: true,
        publishedAt: true,
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
    .then((row) => (row ? flattenPostTags(row) : null));
}

export default function EditPostPage(props: EditPostPageProps) {
  return (
    <DashboardRouteBoundary title="Edit post">
      <EditPostContent {...props} />
    </DashboardRouteBoundary>
  );
}

async function EditPostContent({ params }: EditPostPageProps) {
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
