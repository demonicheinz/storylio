import {
  ArticleIcon,
  EyeIcon,
  PencilSimpleIcon,
  PlusIcon,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { connection } from "next/server";
import { PostDeleteButton } from "@/components/dashboard/post-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PostStatus } from "@/generated/prisma";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

type PostsPageProps = {
  searchParams: Promise<{
    sort?: string | string[];
  }>;
};

const sortOptions = [
  { label: "Newest", value: "created" },
  { label: "Published", value: "published" },
  { label: "Views", value: "views" },
  { label: "Title", value: "title" },
] as const;

type SortValue = (typeof sortOptions)[number]["value"];

function getSortValue(value: string | string[] | undefined): SortValue {
  const sort = Array.isArray(value) ? value[0] : value;

  if (sortOptions.some((option) => option.value === sort)) {
    return sort as SortValue;
  }

  return "created";
}

function getOrderBy(sort: SortValue) {
  switch (sort) {
    case "published":
      return [{ publishedAt: "desc" as const }, { createdAt: "desc" as const }];
    case "views":
      return [{ viewCount: "desc" as const }, { createdAt: "desc" as const }];
    case "title":
      return [{ title: "asc" as const }];
    case "created":
    default:
      return [{ createdAt: "desc" as const }];
  }
}

async function getPosts(sort: SortValue) {
  return db.post.findMany({
    orderBy: getOrderBy(sort),
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      createdAt: true,
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
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  await connection();

  const sort = getSortValue((await searchParams).sort);
  const posts = await getPosts(sort);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Posts</h1>
          <p className="mt-2 text-muted-foreground">
            Manage blog drafts, published articles, metadata, and view counts.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/posts/new">
            <PlusIcon data-icon="inline-start" />
            New Post
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Blog Posts</CardTitle>
          <CardDescription>
            {posts.length} {posts.length === 1 ? "post" : "posts"} in the
            database.
          </CardDescription>
          <CardAction className="flex flex-wrap gap-2">
            {sortOptions.map((option) => (
              <Button
                key={option.value}
                asChild
                size="sm"
                variant={sort === option.value ? "secondary" : "outline"}
              >
                <Link href={`/dashboard/posts?sort=${option.value}`}>
                  {option.label}
                </Link>
              </Button>
            ))}
          </CardAction>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
              <ArticleIcon className="size-12 text-muted-foreground/50" />
              <div>
                <p className="font-medium">No posts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create the first draft and start shaping the writing section.
                </p>
              </div>
              <Button asChild>
                <Link href="/dashboard/posts/new">
                  <PlusIcon data-icon="inline-start" />
                  New Post
                </Link>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {posts.map((post) => {
                const isPublished = post.status === PostStatus.PUBLISHED;
                const displayDate =
                  isPublished && post.publishedAt
                    ? post.publishedAt
                    : post.createdAt;

                return (
                  <div
                    key={post.id}
                    className="grid gap-4 rounded-2xl border bg-background/40 p-4 md:grid-cols-[minmax(0,1fr)_auto]"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate font-heading text-lg font-semibold">
                          {post.title}
                        </h2>
                        <Badge variant={isPublished ? "default" : "secondary"}>
                          {isPublished ? "published" : "draft"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        /blog/{post.slug}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>{formatDate(displayDate)}</span>
                        <span className="inline-flex items-center gap-1">
                          <EyeIcon data-icon="inline-start" />
                          {post.viewCount} views
                        </span>
                        {post.tags.map((tag) => (
                          <Badge
                            key={tag.name}
                            variant="outline"
                            className="text-[11px]"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/blog/${post.slug}`} target="_blank">
                          <EyeIcon data-icon="inline-start" />
                          Preview
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/dashboard/posts/${post.id}/edit`}>
                          <PencilSimpleIcon data-icon="inline-start" />
                          Edit
                        </Link>
                      </Button>
                      <PostDeleteButton postId={post.id} title={post.title} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
