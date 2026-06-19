"use client";

import {
  ArticleIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  DotsThreeVerticalIcon,
  EyeIcon,
  FileTextIcon,
  FunnelSimpleIcon,
  GridFourIcon,
  ListBulletsIcon,
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
import { toast } from "sonner";
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
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import {
  actionDeletePosts,
  actionMovePostsToDraft,
  actionPublishPosts,
} from "@/features/dashboard/posts/actions";
import { PostDeleteButton } from "@/features/dashboard/posts/components/post-delete-button";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import { blurBeforeOpen } from "@/features/dashboard/shared/utils/overlay-focus";
import type { ActionResult } from "@/lib/action-result";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn, formatDate } from "@/lib/utils";

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
type StatusFilter = "all" | "published" | "draft";
type SortMode = "newest" | "updated" | "views" | "title" | "published";

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All Status" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
];

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: "newest", label: "Newest First" },
  { value: "updated", label: "Recently Updated" },
  { value: "views", label: "Most Viewed" },
  { value: "title", label: "Title A-Z" },
  { value: "published", label: "Published First" },
];

function isPublished(post: DashboardPost) {
  return post.status === "PUBLISHED";
}

function getPostViews(post: DashboardPost) {
  return isPublished(post) ? post.viewCount : 0;
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

function formatPercent(value: number, total: number) {
  if (total === 0) {
    return "0% of total";
  }

  return `${Math.round((value / total) * 100)}% of total`;
}

function StatusBadge({
  post,
  compact = false,
}: {
  post: DashboardPost;
  compact?: boolean;
}) {
  const published = isPublished(post);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        published
          ? "bg-emerald-500/12 text-emerald-300"
          : "bg-amber-500/12 text-amber-300",
        compact && "px-2 py-0.5",
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          published ? "bg-emerald-300" : "bg-amber-300",
        )}
      />
      {published ? "Published" : "Draft"}
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
        "relative aspect-video overflow-hidden rounded-2xl border border-border/60 bg-muted/30",
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
        <div className="flex h-full items-center justify-center text-muted-foreground">
          <ArticleIcon className="size-8" />
        </div>
      )}
    </div>
  );
}

function PostsStatCard({
  label,
  value,
  description,
  icon,
  iconClassName,
  className,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
  className?: string;
}) {
  return (
    <Card className={dashboardStyles.statCard}>
      <CardContent className={dashboardStyles.statContent}>
        <div className={cn(dashboardStyles.statIcon, iconClassName)}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={cn("font-heading text-xl font-bold", className)}>
            {value}
          </p>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground/80">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterDropdown<T extends string>({
  label,
  value,
  displayValue,
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-0 justify-between rounded-2xl bg-input/35 px-3"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] leading-none text-muted-foreground">
              {label}
            </span>
            <span className="mt-1 block truncate text-xs font-medium">
              {displayValue}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onValueChange(nextValue as T)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TagDropdown({
  tags,
  selectedTags,
  onToggleTag,
  onClear,
}: {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClear: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 min-w-0 justify-between rounded-2xl bg-input/35 px-3"
        >
          <span className="min-w-0 text-left">
            <span className="block text-[10px] leading-none text-muted-foreground">
              Tag
            </span>
            <span className="mt-1 block truncate text-xs font-medium">
              {selectedTags.length === 0
                ? "All Tags"
                : `${selectedTags.length} selected`}
            </span>
          </span>
          <CaretDownIcon className="ml-2 size-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Filter by tags</DropdownMenuLabel>
        <DropdownMenuItem onSelect={onClear}>All Tags</DropdownMenuItem>
        <DropdownMenuSeparator />
        {tags.length === 0 ? (
          <DropdownMenuItem disabled>No tags yet</DropdownMenuItem>
        ) : (
          tags.map((tag) => (
            <DropdownMenuCheckboxItem
              key={tag}
              checked={selectedTags.includes(tag)}
              onCheckedChange={() => onToggleTag(tag)}
              onSelect={(event) => event.preventDefault()}
            >
              {tag}
            </DropdownMenuCheckboxItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
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
    <div className="grid shrink-0 grid-cols-2 rounded-xl border border-border/60 bg-background/35 p-1">
      <Button
        type="button"
        size="icon"
        variant={viewMode === "list" ? "default" : "ghost"}
        className="size-8 rounded-lg"
        onClick={() => onViewModeChange("list")}
        aria-label="List view"
        aria-pressed={viewMode === "list"}
      >
        <ListBulletsIcon />
      </Button>
      <Button
        type="button"
        size="icon"
        variant={viewMode === "grid" ? "default" : "ghost"}
        className="size-8 rounded-lg"
        onClick={() => onViewModeChange("grid")}
        aria-label="Grid view"
        aria-pressed={viewMode === "grid"}
      >
        <GridFourIcon />
      </Button>
    </div>
  );
}

function PostActions({
  post,
  align = "end",
}: {
  post: DashboardPost;
  align?: "start" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="size-8 rounded-xl bg-background/70 text-foreground backdrop-blur hover:bg-background"
          aria-label={`Open actions for ${post.title}`}
        >
          <DotsThreeVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-44">
        <DropdownMenuLabel>Post</DropdownMenuLabel>
        {isPublished(post) && (
          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/blog/${post.slug}`} target="_blank">
              <EyeIcon data-icon="inline-start" />
              Preview
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link href={`/dashboard/posts/${post.id}/edit`}>
            <PencilSimpleIcon data-icon="inline-start" />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <PostDeleteButton
          postId={post.id}
          title={post.title}
          trigger={
            <DropdownMenuItem
              className="cursor-pointer"
              variant="destructive"
              onSelect={(event) => event.preventDefault()}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </DropdownMenuItem>
          }
        />
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
      <Badge variant="outline" className="text-[11px] text-muted-foreground">
        No tags
      </Badge>
    );
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5">
      {visibleTags.map((tag) => (
        <Badge
          key={tag.name}
          variant="secondary"
          className="max-w-32 truncate text-[11px]"
        >
          {tag.name}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="outline" className="text-[11px]">
          +{remaining}
        </Badge>
      )}
    </div>
  );
}

function PostsGrid({
  posts,
  batchMode,
  selectedIds,
  onTogglePost,
}: {
  posts: DashboardPost[];
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
            "group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/45 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-soft/40 hover:shadow-[0_20px_70px_rgba(0,0,0,0.22)]",
            selectedIds.has(post.id) && "border-brand-soft/60 bg-brand/5",
            batchMode && "cursor-pointer",
          )}
          onClick={batchMode ? () => onTogglePost(post.id) : undefined}
        >
          <div className="relative">
            <PostThumbnail post={post} className="rounded-none border-0" />
            {batchMode && (
              <div
                className="absolute top-3 left-3 z-10"
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
              className={cn(
                "absolute left-3 transition-[top]",
                batchMode ? "top-11" : "top-3",
              )}
            >
              <StatusBadge post={post} compact />
            </div>
            <div
              className="absolute top-3 right-3"
              onClick={(event) => event.stopPropagation()}
            >
              <PostActions post={post} />
            </div>
          </div>
          <div className="flex min-h-48 flex-col gap-3 p-4">
            <div className="min-w-0">
              <h2 className="line-clamp-2 font-heading text-base leading-snug font-semibold">
                {post.title}
              </h2>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                /blog/{post.slug}
              </p>
            </div>
            <TagPills tags={post.tags} />
            <div className="mt-auto flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="truncate">
                {post.publishedAt ? formatDate(post.publishedAt) : "—"}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1">
                <EyeIcon className="size-3.5" />
                {getPostViews(post).toLocaleString("en-US")} views
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
  selectedIds,
  batchMode,
  onTogglePost,
  onTogglePage,
  onMobilePostClick,
}: {
  posts: DashboardPost[];
  selectedIds: Set<string>;
  batchMode: boolean;
  onTogglePost: (id: string) => void;
  onTogglePage: () => void;
  onMobilePostClick: (id: string) => void;
}) {
  const allSelected =
    posts.length > 0 && posts.every((post) => selectedIds.has(post.id));
  const desktopGridColumns = batchMode
    ? "grid-cols-[44px_minmax(360px,1fr)_130px_90px_160px_160px_56px]"
    : "grid-cols-[minmax(360px,1fr)_130px_90px_160px_160px_56px]";

  return (
    <>
      <div className={cn(dashboardStyles.listSurface, "hidden xl:block")}>
        <div
          className={cn("grid", desktopGridColumns, dashboardStyles.listHeader)}
        >
          {batchMode && (
            <div>
              <Checkbox
                checked={allSelected}
                onCheckedChange={onTogglePage}
                aria-label="Select visible posts"
              />
            </div>
          )}
          <div>Title</div>
          <div>Status</div>
          <div>Views</div>
          <div>Created at</div>
          <div>Updated at</div>
          <div className="text-right">Actions</div>
        </div>
        <div className={dashboardStyles.listRows}>
          {posts.map((post) => (
            <div
              key={post.id}
              className={cn(
                "grid min-w-0 items-center px-3 py-3",
                desktopGridColumns,
              )}
            >
              {batchMode && (
                <div>
                  <Checkbox
                    checked={selectedIds.has(post.id)}
                    onCheckedChange={() => onTogglePost(post.id)}
                    aria-label={`Select ${post.title}`}
                  />
                </div>
              )}
              <div className="flex min-w-0 items-center gap-3 pr-4">
                <PostThumbnail
                  post={post}
                  className="h-16 w-28 shrink-0 rounded-xl"
                  sizes="112px"
                />
                <div className="min-w-0">
                  <h2 className="line-clamp-2 font-heading text-sm leading-snug font-semibold">
                    {post.title}
                  </h2>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    /blog/{post.slug}
                  </p>
                  <div className="mt-2">
                    <TagPills tags={post.tags} limit={4} />
                  </div>
                </div>
              </div>
              <div>
                <StatusBadge post={post} />
              </div>
              <div className="text-sm text-muted-foreground">
                {getPostViews(post).toLocaleString("en-US")}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(post.createdAt)}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDateTime(post.updatedAt)}
              </div>
              <div className="flex justify-end">
                <PostActions post={post} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3 xl:hidden">
        {posts.map((post) => (
          <article
            key={post.id}
            className={cn(
              "min-w-0 rounded-2xl border border-border/70 bg-background/45 p-4 transition-colors select-none",
              selectedIds.has(post.id) && "border-brand-soft/50 bg-brand/5",
              batchMode && "cursor-pointer",
            )}
            onClick={() => onMobilePostClick(post.id)}
          >
            <div
              className={cn(
                "flex min-w-0 items-start transition-[gap] duration-200",
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
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      isPublished(post) ? "bg-emerald-300" : "bg-amber-300",
                    )}
                  />
                  <h2 className="line-clamp-2 font-heading text-base leading-snug font-semibold">
                    {post.title}
                  </h2>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  /blog/{post.slug}
                </p>
              </div>
              <div
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                <PostActions post={post} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge post={post} compact />
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <EyeIcon className="size-3.5" />
                {getPostViews(post).toLocaleString("en-US")} views
              </span>
              <span className="text-xs text-muted-foreground">
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
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onClear,
}: {
  selectedCount: number;
  isPending: boolean;
  onPublish: () => void;
  onMoveToDraft: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/55 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">
          {selectedCount} {selectedCount === 1 ? "post" : "posts"} selected
        </p>
        <p className="text-xs text-muted-foreground">
          Apply publishing changes or remove selected posts.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <Button
          type="button"
          size="sm"
          className="rounded-xl"
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
          className="rounded-xl bg-input/35"
          disabled={isPending || selectedCount === 0}
          onClick={onMoveToDraft}
        >
          Move to draft
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="rounded-xl"
              disabled={isPending || selectedCount === 0}
            >
              <TrashIcon data-icon="inline-start" />
              Delete
            </Button>
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
          className="rounded-xl"
          disabled={isPending}
          onClick={onClear}
        >
          Clear
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
    <div className="flex items-center justify-center gap-1">
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-8 rounded-xl"
        disabled={page <= 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
        aria-label="Previous page"
      >
        <CaretLeftIcon />
      </Button>
      {Array.from({ length: pageCount }).map((_, index) => {
        const pageNumber = index + 1;

        return (
          <Button
            key={pageNumber}
            type="button"
            size="icon"
            variant={pageNumber === page ? "default" : "outline"}
            className="size-8 rounded-xl"
            onClick={() => onPageChange(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
          >
            {pageNumber}
          </Button>
        );
      })}
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="size-8 rounded-xl"
        disabled={page >= pageCount}
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        aria-label="Next page"
      >
        <CaretRightIcon />
      </Button>
    </div>
  );

  return (
    <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-[1fr_auto_1fr] md:items-center">
      <div className="flex items-center justify-between md:contents">
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
      <div className="hidden justify-end md:flex">
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
        <span className="text-sm text-muted-foreground">Items per page</span>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl bg-input/35"
          >
            {value}
            <CaretDownIcon className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-24">
          <DropdownMenuRadioGroup
            value={String(value)}
            onValueChange={(nextValue) => onValueChange(Number(nextValue))}
          >
            {options.map((option) => (
              <DropdownMenuRadioItem key={option} value={String(option)}>
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [itemsPerPage, setItemsPerPage] = useState<number>(
    getDefaultItemsPerPage("list"),
  );
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [isBatchPending, startBatchTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftStatus, setDraftStatus] = useState<StatusFilter>(status);
  const [draftTags, setDraftTags] = useState<string[]>(selectedTags);
  const [draftSort, setDraftSort] = useState<SortMode>(sortMode);
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
    const published = posts.filter(isPublished).length;
    const drafts = posts.length - published;

    return {
      total: posts.length,
      published,
      drafts,
      totalViews: posts.reduce((sum, post) => sum + getPostViews(post), 0),
    };
  }, [posts]);

  const filteredPosts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...posts]
      .filter((post) => {
        if (status === "published" && !isPublished(post)) {
          return false;
        }

        if (status === "draft" && isPublished(post)) {
          return false;
        }

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
          isPublished(post) ? "published" : "draft",
          ...post.tags.map((tag) => tag.name),
        ].some((value) => value.toLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        if (sortMode === "updated") {
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }

        if (sortMode === "views") {
          return getPostViews(b) - getPostViews(a);
        }

        if (sortMode === "title") {
          return a.title.localeCompare(b.title);
        }

        if (sortMode === "published") {
          const aTime = a.publishedAt
            ? new Date(a.publishedAt).getTime()
            : Number.NEGATIVE_INFINITY;
          const bTime = b.publishedAt
            ? new Date(b.publishedAt).getTime()
            : Number.NEGATIVE_INFINITY;
          return bTime - aTime;
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [posts, query, selectedTags, sortMode, status]);

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
  }, [itemsPerPage, query, selectedTags, sortMode, status]);

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

  const toggleDraftTag = (tag: string) => {
    setDraftTags((currentTags) =>
      currentTags.includes(tag)
        ? currentTags.filter((item) => item !== tag)
        : [...currentTags, tag],
    );
  };

  const openFilters = () => {
    setDraftStatus(status);
    setDraftTags(selectedTags);
    setDraftSort(sortMode);
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
    setFiltersOpen(false);
  };

  const resetFilters = () => {
    setDraftStatus("all");
    setDraftTags([]);
    setDraftSort("newest");
    setStatus("all");
    setSelectedTags([]);
    setSortMode("newest");
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
      const result = await action(postIds);

      if (result.success) {
        toast.success(result.message ?? fallbackMessage);
        clearSelection();
        router.refresh();
        return;
      }

      toast.error(result.error);
    });
  };

  const publishSelectedPosts = () => {
    runBatchAction(actionPublishPosts, "Selected posts published.");
  };

  const moveSelectedPostsToDraft = () => {
    runBatchAction(actionMovePostsToDraft, "Selected posts moved to draft.");
  };

  const deleteSelectedPosts = () => {
    runBatchAction(actionDeletePosts, "Selected posts deleted.");
  };

  const statusDisplay =
    statusOptions.find((option) => option.value === status)?.label ??
    "All Status";
  const sortDisplay =
    sortOptions.find((option) => option.value === sortMode)?.label ??
    "Newest First";

  return (
    <div className={dashboardStyles.page}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-3xl font-bold">Posts</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage blog drafts, published articles, metadata, and view counts.
          </p>
        </div>
        <Button
          asChild
          size="icon"
          className="size-10 shrink-0 rounded-full md:h-9 md:w-auto md:rounded-3xl md:px-4"
        >
          <Link href="/dashboard/posts/new">
            <PlusIcon data-icon="inline-start" />
            <span className="sr-only md:not-sr-only">New Post</span>
          </Link>
        </Button>
      </div>

      <div className={dashboardStyles.statGrid}>
        <PostsStatCard
          label="Total Posts"
          value={stats.total}
          description="All time"
          icon={<FileTextIcon />}
          iconClassName="bg-sky-500/12 text-sky-300"
          className="text-sky-300"
        />
        <PostsStatCard
          label="Published"
          value={stats.published}
          description={formatPercent(stats.published, stats.total)}
          icon={<EyeIcon />}
          iconClassName="bg-emerald-500/12 text-emerald-300"
          className="text-emerald-300"
        />
        <PostsStatCard
          label="Drafts"
          value={stats.drafts}
          description={formatPercent(stats.drafts, stats.total)}
          icon={<PencilSimpleIcon />}
          iconClassName="bg-amber-500/12 text-amber-300"
          className="text-amber-300"
        />
        <PostsStatCard
          label="Total Views"
          value={stats.totalViews.toLocaleString("en-US")}
          description="All time"
          icon={<EyeIcon />}
          iconClassName="bg-fuchsia-500/12 text-fuchsia-300"
          className="text-fuchsia-300"
        />
      </div>

      <Card className={dashboardStyles.toolbarCard}>
        <CardContent className={dashboardStyles.toolbarContent}>
          <div className="grid gap-3 md:hidden">
            <div className="flex min-w-0 gap-2">
              <div className="relative min-w-0 flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={mobileSearchInputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search posts..."
                  className="h-10 rounded-2xl bg-input/45 pr-14 pl-9"
                  aria-label="Search posts"
                />
                <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                  ⌘ K
                </Kbd>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-10 shrink-0 rounded-2xl bg-input/35"
                onClick={(event) => blurBeforeOpen(event, openFilters)}
              >
                <FunnelSimpleIcon data-icon="inline-start" />
                Filters
              </Button>
              <Button
                type="button"
                variant={batchMode ? "secondary" : "outline"}
                className="h-10 shrink-0 rounded-2xl bg-input/35"
                onClick={toggleBatchMode}
              >
                {batchMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>

          <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_140px_140px_160px_auto_auto]">
            <div className="relative min-w-0 md:col-span-2 xl:col-span-1">
              <MagnifyingGlassIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={desktopSearchInputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search posts..."
                className="h-11 rounded-2xl bg-input/45 pr-14 pl-9"
                aria-label="Search posts"
              />
              <Kbd className="absolute top-1/2 right-2 -translate-y-1/2 border border-border/50 bg-background/60">
                ⌘ K
              </Kbd>
            </div>
            <FilterDropdown
              label="Status"
              value={status}
              displayValue={statusDisplay}
              options={statusOptions}
              onValueChange={setStatus}
            />
            <TagDropdown
              tags={tags}
              selectedTags={selectedTags}
              onToggleTag={toggleTag}
              onClear={() => setSelectedTags([])}
            />
            <FilterDropdown
              label="Sort by"
              value={sortMode}
              displayValue={sortDisplay}
              options={sortOptions}
              onValueChange={setSortMode}
            />
            <div className="md:justify-self-start xl:justify-self-auto">
              <ViewToggle
                viewMode={viewMode}
                onViewModeChange={handleViewModeChange}
              />
            </div>
            <Button
              type="button"
              variant={batchMode ? "secondary" : "outline"}
              className="h-11 rounded-2xl bg-input/35"
              onClick={toggleBatchMode}
            >
              {batchMode ? "Cancel" : "Select"}
            </Button>
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex">
              <span className="text-xs text-muted-foreground">
                Active tags:
              </span>
              {selectedTags.map((tag) => (
                <Button
                  key={tag}
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 rounded-full px-2.5 text-xs"
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
                className="h-7 rounded-full px-2.5 text-xs"
                onClick={() => setSelectedTags([])}
              >
                Clear
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {batchMode && (
        <BatchActionsBar
          selectedCount={selectedIds.size}
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
            <p className="font-medium">No posts found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust the filters or create a new article draft.
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
        <>
          {viewMode === "grid" ? (
            <PostsGrid
              posts={paginatedPosts}
              batchMode={batchMode}
              selectedIds={selectedIds}
              onTogglePost={togglePostSelection}
            />
          ) : (
            <PostsList
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

      <Drawer
        open={filtersOpen}
        onOpenChange={handleFiltersOpenChange}
        direction="bottom"
      >
        <DrawerContent className="p-0 before:inset-x-0 before:top-2 before:bottom-0 before:rounded-t-4xl before:rounded-b-none">
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>
              Refine posts by publishing state, tags, and order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 px-4 pb-2">
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
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={draftTags.length === 0 ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => setDraftTags([])}
                >
                  All Tags
                </Button>
                {tags.map((tag) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant={draftTags.includes(tag) ? "default" : "outline"}
                    className="rounded-xl"
                    onClick={() => toggleDraftTag(tag)}
                  >
                    <TagIcon data-icon="inline-start" />
                    {tag}
                  </Button>
                ))}
              </div>
            </div>
            <FilterDropdown
              label="Sort by"
              value={draftSort}
              displayValue={
                sortOptions.find((option) => option.value === draftSort)
                  ?.label ?? "Newest First"
              }
              options={sortOptions}
              onValueChange={setDraftSort}
            />
          </div>
          <DrawerFooter>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={resetFilters}
              >
                Reset filters
              </Button>
              <Button
                type="button"
                className="rounded-2xl"
                onClick={applyFilters}
              >
                Apply filters
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
