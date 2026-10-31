import { EyeIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { cn, formatDate } from "@/lib/utils";
import { getPostViews, isNote, isPublished } from "../presentation";
import type { DashboardPost } from "../types";
import {
  PostActions,
  PostThumbnail,
  StatusBadge,
  TagPills,
} from "./post-display";

export function PostsGrid({
  posts,
  now,
  batchMode,
  selectedIds,
  onTogglePost,
}: {
  posts: DashboardPost[];
  now: number;
  batchMode: boolean;
  selectedIds: Set<string>;
  onTogglePost: (id: string) => void;
}) {
  return (
    <div className={dashboardStyles.gridCards}>
      {posts.map((post) => (
        /* biome-ignore lint/a11y/useKeyWithClickEvents: Batch keyboard selection is provided by the nested checkbox; do not add a duplicate card tab stop. */
        <article
          key={post.id}
          className={cn(
            "group flex flex-col bg-card border border-border hover:border-border-hover rounded-lg min-w-0 overflow-hidden transition-colors",
            selectedIds.has(post.id) && "border-brand-soft/60 bg-brand/5",
            batchMode && "cursor-pointer",
          )}
          onClick={batchMode ? () => onTogglePost(post.id) : undefined}
        >
          <div className="relative">
            <PostThumbnail post={post} className="border-0 rounded-none" />
            {batchMode && (
              /* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only isolates nested checkbox/menu clicks; keyboard interaction stays on those controls. */
              <div
                role="presentation"
                className="top-3 left-3 z-10 absolute"
                onClick={(event) => event.stopPropagation()}
              >
                <Checkbox
                  checked={selectedIds.has(post.id)}
                  onCheckedChange={() => onTogglePost(post.id)}
                  aria-label={`Select ${post.title}`}
                />
              </div>
            )}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only isolates nested checkbox/menu clicks; keyboard interaction stays on those controls. */}
            <div
              role="presentation"
              className="top-3 right-3 absolute"
              onClick={(event) => event.stopPropagation()}
            >
              <PostActions now={now} post={post} overlay />
            </div>
          </div>
          <div className="flex flex-col flex-1 gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge now={now} post={post} compact />
              <span className="text-muted-foreground text-xs">
                {isNote(post) ? "Note" : "Article"}
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-sans font-semibold text-base line-clamp-2 leading-snug">
                {batchMode ? (
                  post.title
                ) : (
                  <Link
                    href={`/dashboard/posts/${post.id}/edit`}
                    className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring hover:text-link"
                  >
                    {post.title}
                  </Link>
                )}
              </h2>
              <p className="mt-1 text-muted-foreground text-xs truncate">
                {isNote(post) ? "Note" : "Article"} · {post.slug}
              </p>
            </div>
            <TagPills tags={post.tags} />
            <div className="flex justify-between items-center gap-3 mt-auto text-muted-foreground text-xs">
              <span className="truncate">
                {post.publishedAt ? formatDate(post.publishedAt) : "—"}
              </span>
              <span className="inline-flex items-center gap-1 shrink-0">
                <EyeIcon className="size-3.5" />
                {getPostViews(post, now).toLocaleString("en-US")} views
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PostsList({
  posts,
  now,
  selectedIds,
  batchMode,
  onTogglePost,
  onTogglePage,
  onMobilePostClick,
}: {
  posts: DashboardPost[];
  now: number;
  selectedIds: Set<string>;
  batchMode: boolean;
  onTogglePost: (id: string) => void;
  onTogglePage: () => void;
  onMobilePostClick: (id: string) => void;
}) {
  const allSelected =
    posts.length > 0 && posts.every((post) => selectedIds.has(post.id));
  const desktopGridColumns = batchMode
    ? "grid-cols-[44px_minmax(0,1fr)_130px_90px_180px_68px]"
    : "grid-cols-[minmax(0,1fr)_130px_90px_180px_68px]";

  return (
    <>
      <div className={cn(dashboardStyles.listSurface, "hidden xl:block")}>
        <div
          className={cn(
            "grid border-border border-b font-medium text-muted-foreground text-xs",
            desktopGridColumns,
          )}
        >
          {batchMode && (
            <div className="flex justify-center items-center self-stretch">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onTogglePage}
                aria-label="Select visible posts"
              />
            </div>
          )}
          <div className="py-3 pr-3 pl-34">Title</div>
          <div className="p-3">Status</div>
          <div className="p-3">Views</div>
          <div className="p-3">Updated at</div>
          <div className="p-3 text-center">Actions</div>
        </div>
        <div className={dashboardStyles.listRows}>
          {posts.map((post) => (
            <div
              key={post.id}
              className={cn("items-center grid min-w-0", desktopGridColumns)}
            >
              {batchMode && (
                <div className="flex justify-center items-center self-stretch">
                  <Checkbox
                    checked={selectedIds.has(post.id)}
                    onCheckedChange={() => onTogglePost(post.id)}
                    aria-label={`Select ${post.title}`}
                  />
                </div>
              )}
              <div className="flex items-center gap-3 p-3 pr-4 min-w-0">
                <PostThumbnail
                  post={post}
                  className="rounded-xl w-28 h-16 shrink-0"
                  sizes="112px"
                />
                <div className="min-w-0">
                  <h2 className="font-sans font-semibold text-sm line-clamp-2 leading-snug">
                    {batchMode ? (
                      post.title
                    ) : (
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="rounded-sm focus-visible:outline-2 focus-visible:outline-ring hover:text-link"
                      >
                        {post.title}
                      </Link>
                    )}
                  </h2>
                  <p className="mt-1 text-muted-foreground text-xs truncate">
                    {isNote(post) ? "Note" : "Article"} · {post.slug}
                  </p>
                  <div className="mt-2">
                    <TagPills tags={post.tags} limit={4} />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <StatusBadge now={now} post={post} />
              </div>
              <div className="p-3 text-muted-foreground text-sm">
                {getPostViews(post, now).toLocaleString("en-US")}
              </div>
              <div className="p-3 text-muted-foreground text-sm">
                <time
                  dateTime={post.updatedAt}
                  className="flex flex-col gap-1 whitespace-nowrap"
                >
                  <span>
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(new Date(post.updatedAt))}
                  </span>
                  <span className="text-xs">
                    {new Intl.DateTimeFormat("en-US", {
                      timeStyle: "short",
                    }).format(new Date(post.updatedAt))}
                  </span>
                </time>
              </div>
              <div className="flex justify-center p-3">
                <PostActions now={now} post={post} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          dashboardStyles.listSurface,
          "xl:hidden divide-y divide-border",
        )}
      >
        {posts.map((post) => (
          /* biome-ignore lint/a11y/useKeyWithClickEvents: Batch keyboard selection is provided by the nested checkbox; do not add a duplicate card tab stop. */
          <article
            key={post.id}
            className={cn(
              "p-4 min-w-0 transition-colors",
              selectedIds.has(post.id) && "border-brand-soft/50 bg-brand/5",
              batchMode && "cursor-pointer",
            )}
            onClick={batchMode ? () => onMobilePostClick(post.id) : undefined}
          >
            <div
              className={cn(
                "flex items-start min-w-0 transition-[gap] duration-200",
                batchMode ? "gap-3" : "gap-0",
              )}
            >
              <div
                role="presentation"
                className={cn(
                  "grid overflow-hidden transition-[width,opacity,transform] duration-200 ease-out",
                  batchMode
                    ? "w-5 translate-x-0 opacity-100"
                    : "w-0 -translate-x-2 opacity-0",
                )}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
                aria-hidden={!batchMode}
              >
                <Checkbox
                  checked={selectedIds.has(post.id)}
                  onCheckedChange={() => onTogglePost(post.id)}
                  className="mt-1 shrink-0"
                  disabled={!batchMode}
                  tabIndex={batchMode ? 0 : -1}
                  aria-label={`Select ${post.title}`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "rounded-full size-2 shrink-0",
                      isPublished(post, now)
                        ? "bg-success"
                        : "bg-muted-foreground",
                    )}
                  />
                  <h2 className="font-sans font-semibold text-base line-clamp-2 leading-snug">
                    {batchMode ? (
                      post.title
                    ) : (
                      <Link href={`/dashboard/posts/${post.id}/edit`}>
                        {post.title}
                      </Link>
                    )}
                  </h2>
                </div>
                <p className="mt-1 text-muted-foreground text-xs truncate">
                  {isNote(post) ? "Note" : "Article"} · {post.slug}
                </p>
              </div>
              {/* biome-ignore lint/a11y/noStaticElementInteractions: This layout wrapper only isolates nested checkbox/menu clicks; keyboard interaction stays on those controls. */}
              <div
                role="presentation"
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <PostActions now={now} post={post} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <StatusBadge now={now} post={post} compact />
              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                <EyeIcon className="size-3.5" />
                {getPostViews(post, now).toLocaleString("en-US")} views
              </span>
              <span className="text-muted-foreground text-xs">
                Updated {formatDate(post.updatedAt)}
              </span>
            </div>
            <div className="mt-3">
              <TagPills tags={post.tags} limit={2} />
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
