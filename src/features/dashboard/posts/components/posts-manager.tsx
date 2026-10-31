"use client";

import {
  ArticleIcon,
  CheckCircleIcon,
  CheckSquareIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@phosphor-icons/react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { toast } from "@/components/ui/toast";
import {
  actionDeletePosts,
  actionMovePostsToDraft,
  actionPublishPosts,
} from "@/features/dashboard/posts/actions";
import toolbarStyles from "@/features/dashboard/shared/components/collection-toolbar.module.css";
import {
  DashboardMultiFilter,
  DashboardSelect,
  DashboardSort,
  DashboardViewToggle,
} from "@/features/dashboard/shared/components/filter-controls";
import { DashboardPagination } from "@/features/dashboard/shared/components/pagination";
import { DashboardSummary } from "@/features/dashboard/shared/components/summary";
import { confirmAction } from "@/features/dashboard/shared/confirmation";
import { useDashboardFilter } from "@/features/dashboard/shared/hooks/use-dashboard-filter";
import { dashboardStyles } from "@/features/dashboard/shared/styles";
import type { ActionResult } from "@/lib/action-result";
import {
  getDefaultItemsPerPage,
  getItemsPerPageOptions,
  paginateItems,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";
import {
  filterPosts,
  type PostStatusFilter as StatusFilter,
} from "../filtering";
import { getPostViews, isPublished, isScheduled } from "../presentation";
import type {
  DashboardPost,
  PostSortDirection as SortDirection,
  PostSortField as SortMode,
} from "../types";
import { PostsGrid, PostsList } from "./post-collection-view";
import { usePublicationClock } from "./use-publication-clock";

type PostsManagerProps = {
  posts: DashboardPost[];
};

type ViewMode = "list" | "grid";

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

function BatchActionsBar({
  selectedCount,
  selectedPosts,
  outsideViewCount,
  onTogglePage,
  isPending,
  onPublish,
  onMoveToDraft,
  onDelete,
  onClear,
}: {
  selectedCount: number;
  selectedPosts: Pick<DashboardPost, "id" | "title">[];
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
              {selectedPosts.map((post) => (
                <li key={post.id} className="wrap-anywhere">
                  {post.title}
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

  const filteredPosts = useMemo(
    () =>
      filterPosts(
        posts,
        { query, status, selectedTags, sortMode, sortDirection },
        now,
      ),
    [posts, query, selectedTags, sortMode, sortDirection, status, now],
  );

  const {
    items: paginatedPosts,
    pageCount,
    currentPage,
    firstIndex,
    lastIndex,
  } = paginateItems(filteredPosts, page, itemsPerPage);
  const itemsPerPageOptions = getItemsPerPageOptions(viewMode);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Changing any refinement or page size must return the collection to its first page.
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

  const moveSelectedPostsToDraft = async () => {
    if (
      !(await confirmAction(
        "Move selected posts to draft? Public posts will be hidden and schedules cancelled.",
        {
          title: "Move selected posts to draft?",
          confirmLabel: "Move to draft",
          cancelLabel: "Cancel",
        },
      ))
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
            selectedPosts={selectedPosts}
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

            <DashboardPagination
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
