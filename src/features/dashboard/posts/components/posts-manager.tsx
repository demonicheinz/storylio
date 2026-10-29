"use client";

import {
  ArticleIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  ClockIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  FileTextIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  PlusIcon,
  TagIcon,
  TrashIcon,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";
import {
  actionDeletePosts,
  actionMovePostsToDraft,
  actionPublishPosts,
} from "@/features/dashboard/posts/actions";
import { PostDeleteButton } from "@/features/dashboard/posts/components/post-delete-button";
import { getPostPublicationState } from "@/features/dashboard/posts/publication-state";
import toolbarStyles from "@/features/dashboard/shared/components/collection-toolbar.module.css";
import {
  DashboardMultiFilter,
  DashboardSelect,
  DashboardSort,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { useDashboardFilter } from "@/features/dashboard/shared/hooks/use-dashboard-filter";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { ActionResult } from "@/lib/action-result";
import { getPageItems } from "@/lib/archive-pagination";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn, formatDate } from "@/lib/utils";
import { usePublicationClock } from "./use-publication-clock";

export type DashboardPost = {
  id: string;
  title: string;
  slug: string;
  status: "PUBLISHED" | "DRAFT";
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  tags: Array<{ name: string }>;
};

type PostsManagerProps = {
  posts: DashboardPost[];
};

type ViewMode = "list" | "grid";
type StatusFilter = "all" | "published" | "draft" | "scheduled";
type SortMode = "newest" | "updated" | "views" | "title" | "published";
type SortDirection = "asc" | "desc";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
];

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "Date created" },
  { value: "updated", label: "Last updated" },
  { value: "views", label: "Views" },
  { value: "title", label: "Title" },
  { value: "published", label: "Publication date" },
];

function isPublished(post: DashboardPost, now: number) {
  return (
    getPostPublicationState(post.status, post.publishedAt, now) === "published"
  );
}

function isScheduled(post: DashboardPost, now: number) {
  return (
    getPostPublicationState(post.status, post.publishedAt, now) === "scheduled"
  );
}

function isNote(post: DashboardPost) {
  return post.tags.some((tag) => tag.name === "notes");
}

function postHref(post: DashboardPost) {
  return isNote(post)
    ? `/blog?tag=notes&note=${encodeURIComponent(post.slug)}`
    : `/blog/${post.slug}`;
}

function getPostViews(post: DashboardPost, now: number) {
  return isPublished(post, now) ? post.viewCount : 0;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function StatusBadge({
  post,
  now,
  compact = false,
}: {
  post: DashboardPost;
  now: number;
  compact?: boolean;
}) {
  const published = isPublished(post, now);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 bg-surface px-2 border border-border rounded-md h-6 font-medium text-xs",
        published
          ? "text-success"
          : isScheduled(post, now)
            ? "text-brand-soft"
            : "text-muted-foreground",
        compact && "px-2",
      )}
    >
      {isScheduled(post, now) ? (
        <ClockIcon className="size-3" aria-hidden />
      ) : (
        <span
          className={cn(
            "rounded-full size-1.5 shrink-0",
            published ? "bg-success" : "bg-muted-foreground",
          )}
        />
      )}
      {isScheduled(post, now) ? "Scheduled" : published ? "Published" : "Draft"}
    </span>
  );
}

function PostThumbnail({
  post,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw",
}: {
  post: DashboardPost;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative bg-muted/30 border border-border/60 rounded-xl aspect-video overflow-hidden",
        className,
      )}
    >
      {post.coverImage && !failed ? (
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          className="object-cover"
          sizes={sizes}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex justify-center items-center h-full text-muted-foreground">
          <ArticleIcon className="size-8" />
        </div>
      )}
    </div>
  );
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onValueChange,
}: {
  label: string;
  value: T;
  displayValue: string;
  options: Array<{ value: T; label: string }>;
  onValueChange: (value: T) => void;
}) {
  return (
    <DashboardSelect
      label={label}
      triggerClassName="min-h-11"
      value={value}
      options={options}
      onValueChange={onValueChange}
    />
  );
}

function TagDropdown({
  tags,
  selectedTags,
  onValueChange,
}: {
  tags: string[];
  selectedTags: string[];
  onValueChange: (tags: string[]) => void;
}) {
  return (
    <div className="min-w-40">
      <DashboardMultiFilter
        label="Tags"
        labelPlacement="above"
        values={selectedTags}
        options={tags}
        onValueChange={onValueChange}
        emptyLabel="All tags"
      />
    </div>
  );
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}) {
  return (
    <DashboardViewToggle value={viewMode} onValueChange={onViewModeChange} />
  );
}

function PostActions({
  post,
  now,
  align = "end",
  overlay = false,
}: {
  post: DashboardPost;
  now: number;
  align?: "start" | "end";
  overlay?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            size="icon"
            variant={overlay ? "secondary" : "ghost"}
            className={cn(
              "size-11",
              overlay &&
                "bg-popover/80 border-border shadow-sm hover:bg-surface-hover/90",
            )}
            aria-label={`Open actions for ${post.title}`}
          />
        }
      >
        <DotsThreeVerticalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Post</DropdownMenuLabel>
          <DropdownMenuLabel>
            Created {formatDateTime(post.createdAt)}
          </DropdownMenuLabel>
          {isPublished(post, now) && (
            <DropdownMenuItem
              render={<Link href={postHref(post)} target="_blank" />}
            >
              <EyeIcon data-icon="inline-start" />
              View live
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            render={<Link href={`/dashboard/posts/${post.id}/edit`} />}
          >
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <PostDeleteButton
            triggerNativeButton={false}
            postId={post.id}
            title={post.title}
            trigger={
              <DropdownMenuItem variant="destructive" closeOnClick={false}>
                <TrashIcon data-icon="inline-start" />
                Delete
              </DropdownMenuItem>
            }
          />
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TagPills({
  tags,
  limit = 3,
}: {
  tags: Array<{ name: string }>;
  limit?: number;
}) {
  const visibleTags = tags.slice(0, limit);
  const remaining = tags.length - visibleTags.length;

  if (tags.length === 0) {
    return (
      <Badge variant="outline" className="text-muted-foreground text-xs">
        No tags
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5 min-w-0">
      {visibleTags.map((tag) => (
        <Badge
          key={tag.name}
          variant="secondary"
          className="max-w-32 text-xs truncate"
        >
          {tag.name}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-xs">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

function PostsGrid({
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
              <div
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
            <div
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

function PostsList({
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
              <div
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

function BatchActionsBar({
  selectedCount,
  selectedTitles,
  outsideViewCount,
  onTogglePage,
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onClear,
}: {
  selectedCount: number;
  selectedTitles: string[];
  outsideViewCount: number;
  onTogglePage: () => void;
  isPending: boolean;
  onPublish: () => void;
  onMoveToDraft: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex sm:flex-row flex-col sm:justify-between sm:items-center gap-3 bg-card/55 shadow-sm p-3 border border-border/70 rounded-2xl">
      <div className="min-w-0">
        <p className="font-medium text-foreground text-sm">
          {selectedCount} {selectedCount === 1 ? "post" : "posts"} selected
        </p>
        <p className="text-muted-foreground text-xs">
          {outsideViewCount > 0
            ? `${outsideViewCount} selected outside this page. `
            : ""}
          Selection includes chosen pages and filters.
        </p>
      </div>
      <div className="sm:flex sm:flex-wrap sm:justify-end gap-2 grid grid-cols-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onTogglePage}
          disabled={isPending}
        >
          Toggle page selection
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isPending || selectedCount === 0}
          onClick={onPublish}
        >
          <CheckCircleIcon data-icon="inline-start" />
          Publish
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isPending || selectedCount === 0}
          onClick={onMoveToDraft}
        >
          Move to draft
        </Button>
        <AlertDialog>
          <AlertDialogTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending || selectedCount === 0}
              />
            }
          >
            <TrashIcon data-icon="inline-start" />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete selected posts?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {selectedCount}{" "}
                {selectedCount === 1 ? "post" : "posts"}. This action cannot be
                undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <ul className="space-y-1 max-h-48 overflow-y-auto text-sm">
              {selectedTitles.map((title, index) => (
                <li key={`${index}-${title}`} className="wrap-anywhere">
                  {title}
                </li>
              ))}
            </ul>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                disabled={isPending}
                onClick={onDelete}
              >
                {isPending ? "Deleting..." : "Delete selected"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={onClear}
        >
          Cancel selection
        </Button>
      </div>
    </div>
  );
}

function PostsPagination({
  firstIndex,
  lastIndex,
  total,
  page,
  pageCount,
  itemsPerPage,
  itemsPerPageOptions,
  onPageChange,
  onItemsPerPageChange,
}: {
  firstIndex: number;
  lastIndex: number;
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
  itemsPerPageOptions: readonly number[];
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (value: number) => void;
}) {
  const pageControls = (
    <div className="flex justify-center items-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <CaretLeftIcon />
      </Button>
      <span className="md:hidden px-2 text-sm" aria-live="polite">
        Page {page} of {pageCount}
      </span>
      <div className="hidden md:flex items-center gap-1">
        {getPageItems(page, pageCount).map((value, index) =>
          value === "ellipsis" ? (
            <span key={`gap-${index}`} className="px-1" aria-hidden>
              …
            </span>
          ) : (
            <Button
              key={value}
              type="button"
              size="icon"
              variant={value === page ? "default" : "outline"}
              onClick={() => onPageChange(value)}
              aria-label={`Page ${value}`}
              aria-current={value === page ? "page" : undefined}
            >
              {value}
            </Button>
          ),
        )}
      </div>
      <Button
        type="button"
        size="icon"
        variant="outline"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        aria-label="Next page"
      >
        <CaretRightIcon />
      </Button>
    </div>
  );

  return (
    <div className="md:items-center gap-3 grid md:grid-cols-[1fr_auto_1fr] mt-4 text-muted-foreground text-sm">
      <div className="md:contents flex justify-between items-center">
        <p className="md:hidden">
          {firstIndex}-{lastIndex} of {total}
        </p>
        <p className="hidden md:block">
          Showing {firstIndex} to {lastIndex} of {total}{" "}
          {total === 1 ? "item" : "items"}
        </p>
        <div className="md:hidden">
          <ItemsPerPageDropdown
            value={itemsPerPage}
            options={itemsPerPageOptions}
            onValueChange={onItemsPerPageChange}
          />
        </div>
      </div>
      <div className="md:col-start-2">{pageControls}</div>
      <div className="hidden md:flex justify-end">
        <ItemsPerPageDropdown
          value={itemsPerPage}
          options={itemsPerPageOptions}
          onValueChange={onItemsPerPageChange}
          showLabel
        />
      </div>
    </div>
  );
}

function ItemsPerPageDropdown({
  value,
  options,
  onValueChange,
  showLabel = false,
}: {
  value: number;
  options: readonly number[];
  onValueChange: (value: number) => void;
  showLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {showLabel && (
        <span className="text-muted-foreground text-sm">Items per page</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Items per page"
            />
          }
        >
          {value}
          <CaretDownIcon className="size-3.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem
                key={option}
                value={String(option)}
                closeOnClick={true}
              >
                {option}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PostsManager({ posts }: PostsManagerProps) {
  const router = useRouter();
  const now = usePublicationClock(posts.map((post) => post.publishedAt));
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useDashboardFilter<StatusFilter>(
    "status",
    ["all", "published", "draft", "scheduled"],
    "all",
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("list"),
  );
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [isBatchPending, startBatchTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTriggerRef = useRef<HTMLButtonElement>(null);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(status);
  const [draftTags, setDraftTags] = useState<string[]>(selectedTags);
  const [draftSort, setDraftSort] = useState<SortMode>(sortMode);
  const [draftSortDirection, setDraftSortDirection] =
    useState<SortDirection>(sortDirection);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);

  const tags = useMemo(
    () =>
      Array.from(
        new Set(posts.flatMap((post) => post.tags.map((tag) => tag.name))),
      ).sort((a, b) => a.localeCompare(b)),
    [posts],
  );

  const stats = useMemo(() => {
    const published = posts.filter((post) => isPublished(post, now)).length;
    const drafts = posts.filter((post) => post.status === "DRAFT").length;

    return {
      total: posts.length,
      published,
      drafts,
      scheduled: posts.filter((post) => isScheduled(post, now)).length,
      totalViews: posts.reduce((sum, post) => sum + getPostViews(post, now), 0),
    };
  }, [posts, now]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...posts]
      .filter((post) => {
        if (status === "published" && !isPublished(post, now)) {
          return false;
        }

        if (status === "draft" && post.status !== "DRAFT") {
          return false;
        }

        if (status === "scheduled" && !isScheduled(post, now)) return false;

        if (
          selectedTags.length > 0 &&
          !post.tags.some((tag) => selectedTags.includes(tag.name))
        ) {
          return false;
        }

        if (!normalizedQuery) {
          return true;
        }

        return [
          post.title,
          post.slug,
          isScheduled(post, now)
            ? "scheduled"
            : isPublished(post, now)
              ? "published"
              : "draft",
          isNote(post) ? "note" : "article",
          ...post.tags.map((tag) => tag.name),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        const direction = sortDirection === "asc" ? 1 : -1;
        if (sortMode === "updated") {
          return (
            direction *
            (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
          );
        }

        if (sortMode === "views") {
          return direction * (getPostViews(a, now) - getPostViews(b, now));
        }

        if (sortMode === "title") {
          return direction * a.title.localeCompare(b.title);
        }

        if (sortMode === "published") {
          // Undated posts stay last in either direction.
          if (!a.publishedAt) return b.publishedAt ? 1 : 0;
          if (!b.publishedAt) return -1;
          return (
            direction *
            (new Date(a.publishedAt).getTime() -
              new Date(b.publishedAt).getTime())
          );
        }

        return (
          direction *
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        );
      });
  }, [posts, query, selectedTags, sortMode, sortDirection, status, now]);

  const {
    items: paginatedPosts,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredPosts, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);

  useEffect(() => {
    setPage(1);
  }, [itemsPerPage, query, selectedTags, sortMode, sortDirection, status]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "k" ||
        !(event.ctrlKey || event.metaKey)
      ) {
        return;
      }

      event.preventDefault();

      const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
      const input = isMobileViewport
        ? mobileSearchInputRef.current
        : desktopSearchInputRef.current;

      input?.focus();
      input?.select();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleTag = (tag: string) => {
    setSelectedTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((item) => item !== tag)
        : [...currentTags, tag],
    );
  };

  const openFilters = () => {
    setDraftStatus(status);
    setDraftTags(selectedTags);
    setDraftSort(sortMode);
    setDraftSortDirection(sortDirection);
    setFiltersOpen(true);
  };

  const handleFiltersOpenChange = (open: boolean) => {
    if (open) {
      openFilters();
      return;
    }

    setFiltersOpen(false);
  };

  const applyFilters = () => {
    setStatus(draftStatus);
    setSelectedTags(draftTags);
    setSortMode(draftSort);
    setSortDirection(draftSortDirection);
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftStatus("all");
    setDraftTags([]);
    setDraftSort("newest");
    setDraftSortDirection("desc");
    setStatus("all");
    setSelectedTags([]);
    setSortMode("newest");
    setSortDirection("desc");
  };

  const handleViewModeChange = (nextViewMode: ViewMode) => {
    setViewMode(nextViewMode);
    setItemsPerPage(getDefaultItemsPerPage(nextViewMode));
  };

  const togglePostSelection = (id: string) => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      return nextIds;
    });
  };

  const toggleMobilePostSelection = (id: string) => {
    const nextIds = new Set(selectedIds);

    if (nextIds.has(id)) {
      nextIds.delete(id);
    } else {
      nextIds.add(id);
    }

    setSelectedIds(nextIds);

    if (nextIds.size === 0) {
      setBatchMode(false);
    }
  };

  const togglePageSelection = () => {
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      const allSelected =
        paginatedPosts.length > 0 &&
        paginatedPosts.every((post) => nextIds.has(post.id));

      for (const post of paginatedPosts) {
        if (allSelected) {
          nextIds.delete(post.id);
        } else {
          nextIds.add(post.id);
        }
      }

      return nextIds;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBatchMode(false);
  };

  const handleMobilePostClick = (id: string) => {
    if (!batchMode) {
      return;
    }

    toggleMobilePostSelection(id);
  };

  const toggleBatchMode = () => {
    setBatchMode((current) => {
      if (current) {
        setSelectedIds(new Set());
      }

      return !current;
    });
  };

  const runBatchAction = (
    action: (postIds: string[]) => Promise<ActionResult<{ count: number }>>,
    fallbackMessage: string,
  ) => {
    const postIds = Array.from(selectedIds);

    if (postIds.length === 0) {
      return;
    }

    startBatchTransition(async () => {
      try {
        const result = await action(postIds);

        if (result.success) {
          toast.add({
            title: result.message ?? fallbackMessage,
            type: "success",
          });
          clearSelection();
          router.refresh();
          return;
        }

        toast.add({ title: result.error, type: "error" });
      } catch {
        toast.add({
          title:
            "Could not complete the batch action. Selection retained; try again.",
          type: "error",
        });
      }
    });
  };

  const publishSelectedPosts = () => {
    runBatchAction(actionPublishPosts, "Selected posts published.");
  };

  const moveSelectedPostsToDraft = () => {
    if (
      !window.confirm(
        "Move selected posts to draft? Public posts will be hidden and schedules cancelled.",
      )
    )
      return;
    runBatchAction(actionMovePostsToDraft, "Selected posts moved to draft.");
  };

  const deleteSelectedPosts = () => {
    runBatchAction(actionDeletePosts, "Selected posts deleted.");
  };

  const activeFilterCount =
    Number(status !== "all") +
    selectedTags.length +
    Number(sortMode !== "newest") +
    Number(sortDirection !== "desc");
  const hasRefinements = activeFilterCount > 0 || Boolean(query.trim());
  const selectedPosts = posts.filter((post) => selectedIds.has(post.id));
  const outsideViewCount = selectedPosts.filter(
    (post) => !paginatedPosts.some((row) => row.id === post.id),
  ).length;
  const clearFilters = () => {
    resetFilters();
    setQuery("");
  };
  useEffect(() => {
    const ids = new Set(posts.map((post) => post.id));
    setSelectedIds((previous) => {
      const next = new Set([...previous].filter((id) => ids.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [posts]);
  const statusDisplay =
    statusOptions.find((option) => option.value === status)?.label ??
    "All Status";

  return (
    <Drawer
      open={filtersOpen}
      onOpenChange={handleFiltersOpenChange}
      swipeDirection="down"
      showSwipeHandle
    >
      <div className={dashboardStyles.page}>
        <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-4">
          <div className="min-w-0">
            <h1 className="font-heading font-bold text-3xl">Posts</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground text-sm leading-6">
              Manage blog drafts, published articles, metadata, and view counts.
            </p>
          </div>
          <Button
            role="link"
            render={<Link href="/dashboard/posts/new" />}
            nativeButton={false}
            className="shrink-0"
          >
            <PlusIcon data-icon="inline-start" />
            <span>New Post</span>
          </Button>
        </div>

        <DashboardSummary
          items={[
            { label: "Posts", value: stats.total },
            { label: "Published", value: stats.published },
            { label: "Drafts", value: stats.drafts },
            { label: "Scheduled", value: stats.scheduled },
            { label: "Views", value: stats.totalViews.toLocaleString("en-US") },
          ]}
        />

        <Card className={dashboardStyles.toolbarCard}>
          <CardContent
            className={cn(
              dashboardStyles.toolbarContent,
              "[&_input]:min-h-11 [&_button]:min-h-11",
            )}
          >
            <div className={cn("md:hidden", toolbarStyles.mobileToolbar)}>
              <div className={toolbarStyles.mobileRow}>
                <div className={toolbarStyles.mobileSearch}>
                  <MagnifyingGlassIcon
                    className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none"
                    aria-hidden
                  />
                  <Input
                    ref={mobileSearchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search..."
                    className="pr-3 pl-9"
                    aria-label="Search posts"
                  />
                </div>
                <DrawerTrigger
                  render={
                    <Button
                      ref={filtersTriggerRef}
                      type="button"
                      variant="outline"
                      size="icon"
                      className="relative p-0 size-11"
                      aria-label={
                        activeFilterCount
                          ? `Filters (${activeFilterCount})`
                          : "Filters"
                      }
                      title="Filters"
                    />
                  }
                >
                  <FunnelSimpleIcon aria-hidden />
                  {activeFilterCount > 0 && (
                    <span
                      className="-top-1 -right-1 absolute flex justify-center items-center bg-primary px-1 rounded-full min-w-4 h-4 font-semibold text-[10px] text-primary-foreground pointer-events-none"
                      aria-hidden
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </DrawerTrigger>
                <Button
                  type="button"
                  size="icon"
                  variant={batchMode ? "secondary" : "outline"}
                  className="p-0 size-11"
                  aria-label={batchMode ? "Exit selection mode" : "Select"}
                  aria-pressed={batchMode}
                  title="Select posts"
                  onClick={toggleBatchMode}
                >
                  <CheckSquareIcon aria-hidden />
                </Button>
              </div>
            </div>

            <div className="hidden items-end gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_130px_minmax(150px,220px)_220px_auto] min-w-0">
              <div className="flex flex-col gap-1.5 md:col-span-2 xl:col-span-1 min-w-0">
                <span className="text-muted-foreground text-xs">Search</span>
                <div className="relative min-w-0">
                  <MagnifyingGlassIcon className="top-1/2 left-3 absolute size-4 text-muted-foreground -translate-y-1/2 pointer-events-none" />
                  <Input
                    ref={desktopSearchInputRef}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search posts..."
                    className="pr-14 pl-9"
                    aria-label="Search posts"
                  />
                  <Kbd className="top-1/2 right-2 absolute -translate-y-1/2">
                    ⌘ K
                  </Kbd>
                </div>
              </div>
              <div className="min-w-0">
                <FilterDropdown
                  label="Status"
                  value={status}
                  displayValue={statusDisplay}
                  options={statusOptions}
                  onValueChange={setStatus}
                />
              </div>

              <TagDropdown
                tags={tags}
                selectedTags={selectedTags}
                onValueChange={setSelectedTags}
              />
              <DashboardSort
                value={sortMode}
                options={sortOptions}
                onValueChange={setSortMode}
                direction={sortDirection}
                onDirectionChange={setSortDirection}
              />
              <div className="flex justify-self-end md:justify-self-start xl:justify-self-auto items-center gap-2 w-fit">
                <ViewToggle
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                />
                <Button
                  type="button"
                  variant={batchMode ? "secondary" : "outline"}
                  className="shrink-0"
                  onClick={toggleBatchMode}
                >
                  {batchMode ? "Cancel" : "Select"}
                </Button>
              </div>
            </div>
            {selectedTags.length > 0 && (
              <div className="hidden md:flex flex-wrap items-center gap-2 mt-3">
                <span className="text-muted-foreground text-xs">
                  Active tags:
                </span>
                {selectedTags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="px-2.5"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    <span className="ml-1 text-muted-foreground">×</span>
                  </Button>
                ))}
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="px-2.5"
                  onClick={() => setSelectedTags([])}
                >
                  Clear
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {hasRefinements && (
          <div
            className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm"
            role="status"
          >
            <span>
              {filteredPosts.length}{" "}
              {filteredPosts.length === 1 ? "post" : "posts"} found
            </span>
            {hasRefinements && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="px-0"
                onClick={clearFilters}
              >
                Clear filters and search
              </Button>
            )}
          </div>
        )}
        {batchMode && (
          <BatchActionsBar
            selectedCount={selectedIds.size}
            selectedTitles={selectedPosts.map((post) => post.title)}
            outsideViewCount={outsideViewCount}
            onTogglePage={togglePageSelection}
            isPending={isBatchPending}
            onPublish={publishSelectedPosts}
            onMoveToDraft={moveSelectedPostsToDraft}
            onDelete={deleteSelectedPosts}
            onClear={clearSelection}
          />
        )}

        {filteredPosts.length === 0 ? (
          <div className={dashboardStyles.emptyState}>
            <ArticleIcon className="size-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium">
                {posts.length ? "No posts match these filters" : "No posts yet"}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {posts.length
                  ? "Clear filters or try another search."
                  : "Create an article or a note when you are ready."}
              </p>
            </div>
            {posts.length > 0 && (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters and search
              </Button>
            )}
            <Button
              role="link"
              render={<Link href="/dashboard/posts/new" />}
              nativeButton={false}
            >
              <PlusIcon data-icon="inline-start" />
              New Post
            </Button>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <PostsGrid
                now={now}
                posts={paginatedPosts}
                batchMode={batchMode}
                selectedIds={selectedIds}
                onTogglePost={togglePostSelection}
              />
            ) : (
              <PostsList
                now={now}
                posts={paginatedPosts}
                selectedIds={selectedIds}
                batchMode={batchMode}
                onTogglePost={togglePostSelection}
                onTogglePage={togglePageSelection}
                onMobilePostClick={handleMobilePostClick}
              />
            )}

            <PostsPagination
              firstIndex={firstIndex}
              lastIndex={lastIndex}
              total={filteredPosts.length}
              page={currentPage}
              pageCount={pageCount}
              itemsPerPage={itemsPerPage}
              itemsPerPageOptions={itemsPerPageOptions}
              onPageChange={setPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}

        <DrawerContent
          finalFocus={filtersTriggerRef}
          className="before:top-2 before:bottom-0 before:inset-x-0 p-0"
        >
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Refine posts by publishing state, tags, and order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="gap-4 grid px-4 pb-2 max-h-[52vh] overflow-y-auto scrollbar-none">
            <FilterDropdown
              label="Status"
              value={draftStatus}
              displayValue={
                statusOptions.find((option) => option.value === draftStatus)
                  ?.label ?? "All Status"
              }
              options={statusOptions}
              onValueChange={setDraftStatus}
            />
            <TagDropdown
              tags={tags}
              selectedTags={draftTags}
              onValueChange={setDraftTags}
            />
            <DashboardSort
              value={draftSort}
              options={sortOptions}
              onValueChange={setDraftSort}
              direction={draftSortDirection}
              onDirectionChange={setDraftSortDirection}
            />
          </div>
          <DrawerFooter>
            <div className="gap-2 grid grid-cols-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDraftStatus("all");
                  setDraftTags([]);
                  setDraftSort("newest");
                  setDraftSortDirection("desc");
                }}
              >
                Reset filters
              </Button>
              <Button type="button" onClick={applyFilters}>
                Apply filters
              </Button>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setFiltersOpen(false)}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </div>
    </Drawer>
  );
}
