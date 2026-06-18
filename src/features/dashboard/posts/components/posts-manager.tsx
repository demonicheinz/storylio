"use client";

import {
  ArticleIcon,
  CaretDownIcon,
  CaretLeftIcon,
  CaretRightIcon,
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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { PostDeleteButton } from "@/features/dashboard/posts/components/post-delete-button";
import { blurBeforeOpen } from "@/features/dashboard/shared/utils/overlay-focus";
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
    <Card className="min-w-0 border-border/70 bg-card/55 py-4 shadow-sm">
      <CardContent className="flex items-center gap-3 px-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            iconClassName,
          )}
        >
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

function PostsGrid({ posts }: { posts: DashboardPost[] }) {
  return (
    <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="group min-w-0 overflow-hidden rounded-2xl border border-border/70 bg-background/45 transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-brand-soft/40 hover:shadow-[0_20px_70px_rgba(0,0,0,0.22)]"
        >
          <div className="relative">
            <PostThumbnail post={post} className="rounded-none border-0" />
            <div className="absolute top-3 left-3">
              <StatusBadge post={post} compact />
            </div>
            <div className="absolute top-3 right-3">
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
  onTogglePost,
  onTogglePage,
}: {
  posts: DashboardPost[];
  selectedIds: Set<string>;
  onTogglePost: (id: string) => void;
  onTogglePage: () => void;
}) {
  const allSelected =
    posts.length > 0 && posts.every((post) => selectedIds.has(post.id));

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-border/70 bg-background/30 xl:block">
        <div className="grid grid-cols-[44px_minmax(360px,1fr)_130px_90px_160px_160px_56px] border-b border-border/60 px-3 py-3 text-[11px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
          <div>
            <Checkbox
              checked={allSelected}
              onCheckedChange={onTogglePage}
              aria-label="Select visible posts"
            />
          </div>
          <div>Title</div>
          <div>Status</div>
          <div>Views</div>
          <div>Created at</div>
          <div>Updated at</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-border/60">
          {posts.map((post) => (
            <div
              key={post.id}
              className="grid min-w-0 grid-cols-[44px_minmax(360px,1fr)_130px_90px_160px_160px_56px] items-center px-3 py-3"
            >
              <div>
                <Checkbox
                  checked={selectedIds.has(post.id)}
                  onCheckedChange={() => onTogglePost(post.id)}
                  aria-label={`Select ${post.title}`}
                />
              </div>
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
            className="min-w-0 rounded-2xl border border-border/70 bg-background/45 p-4"
          >
            <div className="flex min-w-0 items-start gap-3">
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
              <PostActions post={post} />
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

function PostsPagination({
  firstIndex,
  lastIndex,
  total,
  page,
  pageCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: {
  firstIndex: number;
  lastIndex: number;
  total: number;
  page: number;
  pageCount: number;
  itemsPerPage: number;
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
            onValueChange={onItemsPerPageChange}
          />
        </div>
      </div>
      <div className="md:col-start-2">{pageControls}</div>
      <div className="hidden justify-end md:flex">
        <ItemsPerPageDropdown
          value={itemsPerPage}
          onValueChange={onItemsPerPageChange}
          showLabel
        />
      </div>
    </div>
  );
}

function ItemsPerPageDropdown({
  value,
  onValueChange,
  showLabel = false,
}: {
  value: number;
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
            {["10", "20", "40"].map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
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
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
          return (
            new Date(b.publishedAt ?? 0).getTime() -
            new Date(a.publishedAt ?? 0).getTime()
          );
        }

        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [posts, query, selectedTags, sortMode, status]);

  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / itemsPerPage));
  const currentPage = Math.min(page, pageCount);
  const firstIndex =
    filteredPosts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const lastIndex = Math.min(currentPage * itemsPerPage, filteredPosts.length);
  const paginatedPosts = filteredPosts.slice(firstIndex - 1, lastIndex);

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

  const statusDisplay =
    statusOptions.find((option) => option.value === status)?.label ??
    "All Status";
  const sortDisplay =
    sortOptions.find((option) => option.value === sortMode)?.label ??
    "Newest First";

  return (
    <div className="flex min-w-0 flex-col gap-5">
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
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

      <Card className="min-w-0 overflow-hidden border-border/70 bg-card/55 py-0">
        <CardContent className="min-w-0 p-3 sm:p-4">
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
            </div>
          </div>

          <div className="hidden min-w-0 gap-3 md:grid md:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_150px_150px_170px_auto]">
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
              <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
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

      {filteredPosts.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed text-center">
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
            <PostsGrid posts={paginatedPosts} />
          ) : (
            <PostsList
              posts={paginatedPosts}
              selectedIds={selectedIds}
              onTogglePost={togglePostSelection}
              onTogglePage={togglePageSelection}
            />
          )}

          <PostsPagination
            firstIndex={firstIndex}
            lastIndex={lastIndex}
            total={filteredPosts.length}
            page={currentPage}
            pageCount={pageCount}
            itemsPerPage={itemsPerPage}
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
